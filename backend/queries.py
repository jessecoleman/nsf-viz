import asyncio
from typing import List

from aioelasticsearch import Elasticsearch

async def search_elastic(
    aioes: Elasticsearch,
    toggle: bool,
    terms: List[str] = None,
    fields = ('title', 'abstract'),
    sort = False):

    #s = Search(using=es)

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
                    'grant_amounts_total': {
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