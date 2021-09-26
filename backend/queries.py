import os
import asyncio
from models import Grant, SearchResponse, YearsResponse
import re
import json
from typing import Any, Dict, List, Optional, Tuple

from aioelasticsearch import Elasticsearch
from elasticsearch.exceptions import RequestError
from elasticsearch_dsl import query

import logging
root_logger = logging.getLogger()
logger = logging.getLogger('uvicorn')

INDEX = os.environ.get("ELASTICSEARCH_GRANT_INDEX", "grants")
INDEX_SUGGEST = os.environ.get("ELASTICSEARCH_SUGGEST_INDEX", "grants-suggest")

def get_divisions() -> List[Dict]:
    from ingest_data.parse_abbrevs import abbrevs, normalize
    divisions = []
    for agency, v in abbrevs.items():
        for abbrev, longname in v.items():
            divisions.append({
                'key': abbrev.lower(),
                'name': f"{normalize(longname)} ({agency})",
                'selected': False,
            })
    return divisions

# with open('assets/divisions.json') as div_file:
#     divisions = json.load(div_file)
divisions = get_divisions()
div_map = {d['name']: d['key'] for d in divisions}
inv_div_map = {d['key']: d['name'] for d in divisions}


# def convert(bucket, keys=['key1', 'key2']):
def convert(bucket, keys=['cat1']):
    if 'key_as_string' in bucket:
        bucket['key'] = int(bucket.pop('key_as_string'))
            
    if 'doc_count' in bucket:
        bucket['count'] = bucket.pop('doc_count')

    if 'grant_amounts' in bucket:
        bucket['amount'] = bucket.pop('grant_amounts')['value']
    else:
        bucket['amount'] = 0
    
    bucket['divisions'] = []
    for key in keys:
        if key in bucket:
            bucket['divisions'] += [convert(bucket) for bucket in bucket[key]['buckets']]

    return bucket


def terms_multi_match(terms: List[str], fields: List[str], must_or_should: Optional[str] = None):
    if terms is None or len(terms) == 0:
        return {
            'match_all': {}
        }

    query = {
        'bool': {
            must_or_should: [{
                'multi_match': {
                    'fields': fields,
                    'query': term,
                    'type': 'phrase',
                }
            } for term in terms]
        },
    }

    if must_or_should == 'should':
        query['bool']['minimum_should_match'] = 1
        
    return query
    
    
def year_range_filter(year_range: Tuple[int, int]):
    return {
        'range': {
            'date': {
                'format': 'yyyy',
                'gte': year_range[0],
                'lt': year_range[1] + 1,
            }
        }
    }
    

def year_histogram(aggs: Dict[str, Any]):
    return {
        'years': {
            'date_histogram': {
                'field': 'date',
                'interval': 'year',
                'format': 'yyyy',
                #'min_doc_count': 0,
                #'size': 100,
            },
            'aggs': aggs
        }
    }


grant_amount_agg = {
    'grant_amounts': {
        'sum': {
            'field': 'amount'
        }
    }
}


def term_agg(agg_field: str):
    return {
        agg_field: {
            'terms': {
                'field': agg_field,
                'min_doc_count': 0,
                'size': 100, # TODO: number of divisions
            },
            'aggs': grant_amount_agg
        }
    }


async def year_aggregates(
    aioes: Elasticsearch,
    toggle: bool,
    terms: List[str] = None,
    fields = ('title', 'abstract'),
    sort = False
):
    must_or_should = 'must' if toggle else 'should'

    query = {
        'query': {
            'bool': {}
        },
        'aggs': year_histogram(grant_amount_agg)
    }

    query['query'] = terms_multi_match(terms, fields, must_or_should)
        
    hits = await aioes.search(index=INDEX, body=query)
    per_year_buckets = hits['aggregations']['years']['buckets']
    return YearsResponse(
        per_year=[convert(bucket) for bucket in per_year_buckets]
    )


async def division_aggregates(
        aioes: Elasticsearch,
        toggle: bool,
        terms: List[str] = None,
        year_range: Tuple[int, int] = None, #TODO maybe make this required
        fields = ('title', 'abstract'),
        sort = False
    ):
    
    must_or_should = 'must' if toggle else 'should'

    query = {
        'query': terms_multi_match(terms, fields, must_or_should),
        # 'aggs': {
        #     **term_agg('key1'),
        #     **term_agg('key2'),
        #     **year_histogram({
        #         **term_agg('key1'),
        #         **term_agg('key2')
        #     })
        # }
        'aggs': {
            **term_agg('cat1'),
            **year_histogram({
                **term_agg('cat1'),
            })
        }
    }

    if year_range is not None:

        # if terms is None
        if 'bool' not in query['query']:
            query['query'] = {
                'bool': {}
            }

        # if toggle == "should"
        if 'must' not in query['query']['bool']:
            query['query']['bool']['must'] = []

        query['query']['bool']['must'].append(year_range_filter(year_range))
  
    hits = await aioes.search(index=INDEX, body=query)
    per_year_buckets = hits['aggregations']['years']['buckets']
    # TODO better way to merge these
    # overall_buckets = hits['aggregations']['key1']['buckets']
    # overall_buckets2 = hits['aggregations']['key2']['buckets']
    overall_buckets = hits['aggregations']['cat1']['buckets']

    return SearchResponse(
        per_year=[convert(bucket) for bucket in per_year_buckets],
        #overall=[convert(bucket) for bucket in overall_buckets2 + overall_buckets],
        overall=[convert(bucket) for bucket in overall_buckets],
    )
 

async def term_freqs(aioes: Elasticsearch, terms: List[str], fields: List[str]):

    queries = [{
        'query': {
            'multi_match': {
                'fields': fields,
                'query': term,
                'type': 'phrase',
            }
        },
    } for term in terms]
    
    return await asyncio.gather(*(
        aioes.count(index=INDEX, body=query)
        for query in queries
    ))

    
async def grants(aioes,
        idx: int,
        toggle: bool,
        order_by: str,
        order: str,
        divisions: List[str],
        fields: List[str],
        terms: List[str],
        year_range: Tuple[int, int],
        limit: int = 50,
    ):

    must_or_should = 'must' if toggle else 'should'
    
    must_query = [terms_multi_match(terms, fields, must_or_should)]

    if year_range is not None:
        must_query.append(year_range_filter(year_range))
 
    query = {
        'size': limit,
        'from': idx,
        '_source': {
            'exclude': ['abstract']
        },
        'query': {
            'bool': {
                'filter': [{
                    'bool': {
                        'should': [{
                            'term': {
                                'cat1': div,
                            }
                        } for div in divisions]
                    }
                }],
                'must': must_query
            }
        },
        'sort': [
            {
                order_by: {
                    'order': order
                }
            }
        ],
        'track_scores': True
    }
    
    try:
        response = await aioes.search(index=INDEX, body=query)

    except RequestError as e:
        print(e.info)

    if response['hits']['total'] == 0:
        raise IndexError(404, detail='index out of bounds')

    return [Grant(
        id=hit['_id'],
        score=hit['_score'],
        **hit['_source'],
    ) for hit in response['hits']['hits']]
 
    
async def abstract(aioes, _id: str, terms: str):

    query = {
        'query': {
            'terms': {
                '_id': [_id]
            }
        },
        'highlight': {
            'type':'unified',
            'number_of_fragments': 0,
            'tags_schema': 'styled',
            'fields': {
                'abstract': {
                    'highlight_query': {
                        'bool': {
                            'should': [
                                {
                                    'match_phrase': {
                                        'abstract': {
                                            'query': term
                                        }
                                    }
                                }
                            for term in terms.split(',')]
                        },
                    }
                }
            },
            'pre_tags': ['<em>']
        }
    }

    response = await aioes.search(index=INDEX, body=query)
    hit = response['hits']['hits'][0]
    if 'highlight' in hit:
        highlight = hit['highlight']['abstract'][0]
        # this is an unfortunate limitation of ES highlight that requires merging
        # adjacent <em> spans manually
        return re.sub(r'</em>([-\s]?)<em>', r'\1', highlight)
    else:
        return hit['_source']['abstract']

 
async def typeahead(aioes, prefix: str):
    result = await aioes.search(index=INDEX_SUGGEST, body={
            'suggest': {
                'gram-suggest': {
                    'prefix': prefix,
                    'completion': {
                        'field': 'suggest',
                        'size': 10
                    }
                },
                # 'highlight': {
                #     'pre_tag': '<em>',
                #     'post_tag': '</em>',
                # }
            }
        })

    return [
        g['_source']['term']
        for g in result['suggest']['gram-suggest'][0]['options']
    ]