"""
Elasticsearch DSL queries for aggregating by term/division/year
"""
import os
import asyncio
from models import Grant, SearchResponse, Term, YearsResponse
import re
from typing import Any, Dict, List, Optional

from aioelasticsearch import Elasticsearch
from elasticsearch.exceptions import RequestError

from gensim.models.phrases import Phraser

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

divisions = get_divisions()
div_map = {d['name']: d['key'] for d in divisions}
inv_div_map = {d['key']: d['name'] for d in divisions}


def convert(bucket, keys=['cat1']):
    # convert year bucket
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


def terms_multi_match(
    terms: List[str],
    match: List[str],
    must_or_should: Optional[str] = None
):
    if terms is None or len(terms) == 0:
        return {
            'match_all': {}
        }
        
    query = {
        'bool': {
            must_or_should: [{
                'multi_match': {
                    'fields': match,
                    'query': term,
                    'type': 'phrase',
                }
            } for term in terms]
        },
    }

    if must_or_should == 'should':
        query['bool']['minimum_should_match'] = 1
        
    return query
    

def org_match(org: str):
    return {
        'match': {
            'agency': org
        }
    }
    

def divisions_match(divisions: List[str]):
    return {
        'bool': {
            'should': [{
                'match': {
                    'cat1': division
                }
            } for division in divisions]
        }
    }

    
def year_range_filter(start: int, end: int):
    subquery = {
        'range': {
            'date': {
                'format': 'yyyy',
            }
        }
    }
    if start:
        subquery['range']['date']['gte'] = start

    if end:
        subquery['range']['date']['lt'] = end + 1

    return subquery
    

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

def term_agg(agg_field: str, aggs: Dict[str, Any]):
    return {
        agg_field: {
            'terms': {
                'field': agg_field,
                # 'min_doc_count': 0,
                'size': 100, # has to be greater than total # divisions or it truncates
            },
            'aggs': aggs
        }
    }


async def year_aggregates(
    aioes: Elasticsearch,
    org: str,
    intersection: bool,
    terms: List[str] = None,
    divisions: List[str] = None,
    match = ('title', 'abstract'),
    sort = False
):
    must_or_should = 'must' if intersection else 'should'

    if not match or len(match) == 0:
        match = ('title', 'abstract')

    query = {
        'query': {
            'bool': {
                'must': [
                    terms_multi_match(terms, match, must_or_should),
                    org_match(org),
                    # divisions_match(divisions)
                ],
            }
        },
        'aggs': year_histogram(grant_amount_agg)
    }

    hits = await aioes.search(index=INDEX, body=query)
    per_year_buckets = hits['aggregations']['years']['buckets']
    return YearsResponse(
        per_year=[convert(bucket) for bucket in per_year_buckets]
    )
    

def grants_sort(sort: str, order: str):
    if sort == 'title' or sort is None:
        sort = 'title.raw'
    return [
        {
            sort: {
                'order': order
            }
        }
    ]


async def division_aggregates(
        aioes: Elasticsearch,
        org: str,
        intersection: bool,
        start: Optional[int],
        end: Optional[int],
        match: Optional[List[str]],
        terms: List[str] = None,
    ):
    
    must_or_should = 'must' if intersection else 'should'

    if not match or len(match) == 0:
        match = ('title', 'abstract')

    query = {
        'query': {
            'bool': {
                'must': [
                    terms_multi_match(terms, match, must_or_should),
                    org_match(org),
                ]
            }
        },
        'aggs': {
            **term_agg('cat2', {
                **grant_amount_agg,
                **term_agg('cat1', grant_amount_agg),
            }),   
            **year_histogram(
                term_agg('cat1', grant_amount_agg),
            ),
        },
    }
    
    if start is not None or end is not None:

        # if terms is None
        if 'bool' not in query['query']:
            query['query'] = {
                'bool': {}
            }

        # if toggle == "should"
        if 'must' not in query['query']['bool']:
            query['query']['bool']['must'] = []

        query['query']['bool']['must'].append(year_range_filter(start, end))
        
    hits = await aioes.search(index=INDEX, body=query)
    per_year_buckets = hits['aggregations']['years']['buckets']
    per_directory_buckets = hits['aggregations']['cat2']['buckets']

    return SearchResponse(
        bars=[convert(bucket) for bucket in per_year_buckets],
        divisions=[convert(bucket) for bucket in per_directory_buckets],
    )
 

async def term_freqs(
    aioes: Elasticsearch,
    org: str,
    terms: List[str],
    match: List[str]
):

    queries = [{
        'query': {
            'bool': {
                'must': [
                    {
                        'multi_match': {
                            'fields': match,
                            'query': term,
                            'type': 'phrase',
                        }
                    },
                    org_match(org)
                ]
            }
        }
    } for term in terms]
    
    return await asyncio.gather(*(
        aioes.count(index=INDEX, body=query)
        for query in queries
    ))

    
async def grants(aioes,
        idx: int,
        org: str,
        intersection: bool,
        divisions: List[str],
        match: List[str],
        terms: List[str],
        start: Optional[int],
        end: Optional[int],
        sort: Optional[str] = 'title',
        order: Optional[str] = 'desc',
        limit: int = 50,
        include_abstract: bool = False,
    ):

    must_or_should = 'must' if intersection else 'should'
    
    must_query = [terms_multi_match(terms, match, must_or_should)]

    if start is not None or end is not None:
        must_query.append(year_range_filter(start, end))
 
    query = {
        'size': limit,
        'from': idx,
        'query': {
            'bool': {
                'filter': [
                    {
                        'bool': {
                            'should': [{
                                'term': {
                                    'cat1': div,
                                }
                            } for div in (divisions or [])]
                        },
                    },
                    org_match(org)
                ],
                'must': must_query
            }
        },
        'sort': grants_sort(sort, order),
        'track_scores': True
    }
    
    if not include_abstract:
        query['_source'] = {
            'exclude': ['abstract']
        }

    try:
        response = await aioes.search(index=INDEX, body=query)

    except RequestError as e:
        print(e.info)

    if response['hits']['total'] == 0:
        raise IndexError(404, detail='index out of bounds')

    for hit in response['hits']['hits']:
        yield Grant(
            id=hit['_id'],
            score=hit['_score'],
            **hit['_source'],
        )
 
    
async def abstract(
    aioes,
    _id: str,
    terms: str,
):

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
                            for term in terms]
                        },
                    }
                }
            },
            'pre_tags': ['<em>'],
            'post_tags': ['</em>']
        }
    }

    response = await aioes.search(index=INDEX, body=query)
    hit = response['hits']['hits'][0]
    if 'highlight' in hit:
        highlight = hit['highlight']['abstract'][0]
        # this is an unfortunate limitation of ES highlight that requires merging
        # adjacent <em> spans manually
        highlight = re.sub(r'</em>([-\s\.]*)<em>', r'\1', highlight)
        hit['_source']['abstract'] = highlight

    # return hit['_source']['abstract']
    return Grant(
        id=hit['_id'],
        score=hit['_score'],
        **hit['_source'],
    )
    

async def typeahead(aioes, prefix: str):
    result = await aioes.search(index=INDEX_SUGGEST, body={
            'suggest': {
                'gram-suggest': {
                    'prefix': prefix,
                    'completion': {
                        'field': 'suggest',
                        'size': 15
                    }
                },
            }
        })
    

    return [Term(
        term=g['_source']['term'],
        forms=[form.replace('_', ' ') for form in g['_source'].get('forms', []) if form != g['_source']['term']],
        stem=g['_source']['stem'],
    ) for g in result['suggest']['gram-suggest'][0]['options']]