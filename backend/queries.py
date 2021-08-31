import asyncio
from models import Grant
import re
import json
from typing import List, Tuple

from aioelasticsearch import Elasticsearch
from elasticsearch.exceptions import RequestError
from elasticsearch_dsl import query

INDEX = 'nsf-dev'

with open('assets/divisions.json') as div_file:
    divisions = json.load(div_file)
    div_map = {d['name']: d['key'] for d in divisions}
    inv_div_map = {d['key']: d['name'] for d in divisions}


async def year_division_aggregates(
        aioes: Elasticsearch,
        toggle: bool,
        terms: List[str] = None,
        year_range: Tuple[int, int] = None,
        fields = ('title', 'abstract'),
        sort = False
    ):
    
    must_or_should = 'must' if toggle else 'should'

    query = {
        'query': {},
        'aggs': {
            'divisions': {
                'terms': {
                    'field': 'division_key',
                    'min_doc_count': 0,
                    'size': 100,
                },
                'aggs': {
                    'grant_amounts': {
                        'sum': {
                            'field': 'amount',
                        }
                    }
                }
            },
            'years': {
                'date_histogram': {
                    'field': 'date',
                    'interval': 'year',
                    'format': 'yyyy',
                },
                'aggs': {
                    'divisions': {
                        'terms': {
                            'field': 'division_key',
                            'size': 100, # TODO: number of divisions
                        },
                        'aggs': {
                            'grant_amounts': {
                                'sum': {
                                    'field': 'amount'
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if terms is not None and len(terms) > 0:

        query['query'] = {
            'bool': {
                must_or_should: [
                    {
                        'multi_match': {
                            'fields': fields,
                            'query': term,
                            'type': 'phrase',
                        }
                    }
                for term in terms],
            },
        }
        
    if must_or_should == 'should':
        query['query']['bool']['minimum_should_match'] = 1
        
    if year_range is not None:

        if 'must' not in query['query']['bool']:
            query['query']['bool']['must'] = []

        query['query']['bool']['must'].append({
            'range': {
                'date': {
                    'format': 'yyyy',
                    'gte': year_range[0],
                    'lt': year_range[1] + 1,
                }
            }
        })
        
    if len(query['query']) == 0:
        query['query'] = {
            'match_all': {}
        }
  
    return await aioes.search(index=INDEX, body=query)


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
        year_range: Tuple[int, int]
    ):

    must_or_should = 'must' if toggle else 'should'
    
    query = {
        'size': 50,
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
                                'division': inv_div_map[div]
                            }
                        } for div in divisions]
                    }
                }],
                'must': [{
                    'bool': {
                        must_or_should: [
                            {
                                'multi_match': {
                                    'fields': fields,
                                    'query': term,
                                    'type': 'phrase',
                                }
                            }
                        for term in terms],
                    }
                }]
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
    
    if must_or_should == 'should':
        query['query']['bool']['must'][0]['bool']['minimum_should_match'] = 1

    if year_range is not None:

        query['query']['bool']['must'].append({
            'range': {
                'date': {
                    'format': 'yyyy',
                    'gte': year_range[0],
                    'lt': year_range[1] + 1,
                }
            }
        })
 
    try:
        response = await aioes.search(index=INDEX, body=query)
    except RequestError as e:
        print(e.info)

    if response['hits']['total'] == 0:
        raise Exception(404, detail='index out of bounds')

    grants = []
    for hit in response['hits']['hits']:
        grants.append(Grant(
                id=hit['_id'],
                score=hit['_score'],
                **hit['_source'],
            ))
            
    return grants
 
    
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
    if hit.get('highlight'):
        highlight = hit['highlight']['abstract'][0]
        return re.sub(r'</em>([-\s]?)<em>', r'\1', highlight)
    else:
        return hit['_source']['abstract']

 
async def typeahead(aioes, prefix: str):
    result = await aioes.search(index='nsf-suggest', body={
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

    print(json.dumps(result, indent=2))
    return [
        g['_source']['term']
        for g in result['suggest']['gram-suggest'][0]['options']
    ]
