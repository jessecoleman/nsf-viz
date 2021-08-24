import asyncio
import json
from datetime import datetime
from typing import List, Tuple

from aioelasticsearch import Elasticsearch
from elasticsearch.exceptions import RequestError
from elasticsearch_dsl import query


with open('assets/divisions.json') as div_file:
    divisions = json.load(div_file)
    div_map = {d['name']: d['key'] for d in divisions}


async def year_division_aggregates(
        aioes: Elasticsearch,
        toggle: bool,
        terms: List[str] = None,
        date_range: Tuple[datetime, datetime] = None,
        fields = ('title', 'abstract'),
        sort = False
    ):

    per_year = {
        'query': {
            'match_all': {},
        },
        'aggs': {
            'years': {
                'date_histogram': {
                    'field': 'date',
                    'interval': 'year',
                    'format': 'yyyy',
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

    per_division = {
            'query': {
                'match_all': {},
            },
#            'aggs': {
#                'divisions': {
#                    'terms': {
#                        'field': 'division'
#                    },
            'aggs': {
                'years': {
                    'date_histogram': {
                        'field': 'date',
                        'interval': 'year',
                        'format': 'yyyy',
                    },
                    'aggs': {
                        'divisions': {
                            'terms': {
                                'field': 'division'
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

    sum_total = {
        'query': {
            'match_all': {},
        },
        'aggs': {
            'divisions': {
                'terms': {
                    'field': 'division',
                    'min_doc_count': 0,
                },
                'aggs': {
                    'grant_amounts': {
                        'sum': {
                            'field': 'amount',
                        }
                    }
                }
            }
        }
    }


    if terms is not None:

        per_division['query'] = \
        per_year['query'] = \
        sum_total['query'] = \
            {
                'bool': {
                    ('must' if toggle else 'should'): [
                        {
                            'multi_match': {
                                'fields': fields,
                                'query': term,
                                'type': 'phrase',
                            }
                        }
                    for term in terms]
                }
            }
    
    return await asyncio.gather(
            aioes.search(index='nsf', body=per_year),
            aioes.search(index='nsf', body=per_division),
            aioes.search(index='nsf', body=sum_total),
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
        aioes.count(index='nsf', body=query)
        for query in queries
    ))

    
async def grants(aioes,
        idx: int,
        toggle: bool,
        order_by: str,
        order: str,
        fields: List[str],
        terms: List[str],
    ):

    query = {
        'size': 50,
        'from': idx,
        'query': {
            'bool': {
                #'filter': [
                #    {
                #            
                #],
                ('must' if toggle else 'should'): [
                    {
                        'multi_match': {
                            'fields': fields,
                            'query': term,
                            'type': 'phrase',
                        }
                    }
                for term in terms]
            }
        },
        'sort': [
            {
                order_by: {
                    'order': order
                }
            }
        ]
    }
        
    try:
        response = await aioes.search(index='nsf', body=query)
    except RequestError as e:
        print(e.info)

    if response['hits']['total'] == 0:
        raise Exception(404, detail='index out of bounds')

    grants = []
    for hit in response['hits']['hits']:
        grants.append({
                'score': hit['_score'],
                'id': hit['_id'],
                **hit['_source'],
            })
            
    return grants
 
    
async def abstract(aioes, _id: str, terms: str):

    query = {
        'query': {
            'terms': {
                '_id': [_id]
            }
        },
        'highlight': {
            # 'type':'fvh', // TODO
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
                        }
                    }
                }
            }
        }
    }

    response = await aioes.search(index='nsf', body=query)
    hit = response['hits']['hits'][0]
    if hit.get('highlight'):
        return hit['highlight']['abstract'][0]
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

    print(json.dumps(result['suggest']['gram-suggest'], indent=2))
    return [
        g['_source']['gram']
        for g in result['suggest']['gram-suggest'][0]['options']
    ]
