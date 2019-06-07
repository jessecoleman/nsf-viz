import asyncio
import aiofiles
from starlette.applications import Starlette
from starlette.responses import JSONResponse, StreamingResponse, FileResponse
from starlette.requests import Request
from starlette.exceptions import HTTPException
from gensim.models.word2vec import Word2Vec
import logging
import json
from functools import lru_cache
from collections import defaultdict
from elasticsearch import Elasticsearch as SyncElasticsearch
from aioelasticsearch import Elasticsearch
from aioelasticsearch.helpers import Scan
from elasticsearch_dsl import Search, MultiSearch, Document, Date, Keyword, Text, Index, connections
from elasticsearch_dsl.query import MultiMatch

#logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('uvicorn')

app = Starlette()
app.debug = True

aioes = None
es = None

@app.on_event('startup')
async def startup():
    global aioes, es
    es = SyncElasticsearch()
    aioes = Elasticsearch()


@app.on_event('shutdown')
async def shutdown():
    es.close()
    await aioes.close()


default_terms = [
      'data science',
      'machine learning',
      'artificial intelligence',
      'deep learning',
      'convolutional neural networks',
      'recurrent neural network',
      'stochastic gradient descent',
      'support vector machines',
      'unsupervised learning',
      'supervised learning',
      'reinforcement learning',
      'generative adversarial networks',
      'random forest',
      'naive bayes',
      'bayesian networks',
      'big data'
]


@app.route('/')
@app.route('/<toggle>/<terms>')
def main(toggle='any', terms=default_terms):

    if toggle not in ('any', 'all'):
        abort

    if type(terms) is str:
        terms = terms.split(',')

    with open('static/divisions.csv', 'r') as divs:
        divisions = [{
                'name': d.strip()[:-2],
                'default': d.strip()[-1] == 'y'
            } for i, d in enumerate(divs.readlines())]

    return render_template('index.html', toggle=toggle, divisions=divisions, terms=terms)


@app.route('/divisions')
async def divisions(request: Request):
    return FileResponse('static/divisions.csv', media_type='text/html')


@app.route('/search', methods=['POST'])
async def search(request: Request):

    body = await request.json()


    toggle = body.get('boolQuery')
    terms = body.get('terms')
    divisions = body.get('divisions')
    dependent = body.get('dependant')

    selected_divisions = [k for k, v in divisions.items() if v['selected']]

    logger.info(selected_divisions)

    toggle = (toggle == 'all')

    if terms is None:
        return json.dumps({
            y: {
                'year': y, 
                'data': {
                    'all': {
                        'total_amount': 0,
                        'total_grants': 0,
                        'match_amount': 0,
                        'match_grants': 0
                    }
                }
            } for y in range(2007, 2018)
        })

    per_year, per_division, sum_total = await search_elastic(toggle, terms)
    return JSONResponse({
            'per_year': per_year,
            'per_division': per_division,
            'sum_total': sum_total,
        })

    matched = await search_elastic(toggle, terms)
    order = await search_elastic(toggle, terms, sort=True)

    sort = {i: b.key for i, b in enumerate(order.per_division.buckets)}
    inv_sort = {b.key: i for i, b in enumerate(order.per_division.buckets)}

    json_data = defaultdict(dict)
    json_data['total_grants'] = {b.key: b.agg_grants.value for b in order.per_division.buckets}
    json_data['total_amount'] = {b.key: b.agg_amount.value for b in order.per_division.buckets}

    for year in total.per_year.buckets:
        y = int(year.key_as_string[:4])
        if y not in list(range(2007, 2018)): continue
        json_data[y]['year'] = y
        json_data[y]['all'] = {
            'index': 5,
            'match_grants': 0,
            'match_amount': 0,
            'total_grants': 0,
            'total_amount': 0
        }
        for div in year.per_division.buckets:
            json_data[y]['all']['total_grants'] += div.agg_grants.value
            json_data[y]['all']['total_amount'] += div.agg_amount.value
            json_data[y][div.key] = {
                    'year': y,
                    'index': -1,
                    'total_grants': div.agg_grants.value,
                    'total_amount': div.agg_amount.value,
                    'match_grants': 0,
                    'match_amount': 0
            }

    for year in matched.per_year.buckets:
        y = int(year.key_as_string[:4])
        if y not in list(range(2007, 2018)): continue
        for div in year.per_division.buckets:
            json_data[y]['all']['match_grants'] += div.agg_grants.value
            json_data[y]['all']['match_amount'] += div.agg_amount.value
            json_data[y][div.key].update({
                'index': inv_sort[div.key],
                'match_grants': div.agg_grants.value,
                'match_amount': div.agg_amount.value
            })

    return JSONResponse(json_data)


word_vecs = Word2Vec.load('assets/nsf_w2v_model').wv


@app.route('/typeahead-keywords/{prefix}', methods=['GET'])
async def typeahead(prefix):
    result = await aioes.search(index='nsf-suggest', body={
            'suggest': {
                'gram-suggest': {
                    'prefix': prefix,
                    'completion': {
                        'field': 'suggest',
                        'size': 15
                    }
                }
            }
        })

    return JSONResponse([g['_source']['gram'] for g in result['suggest']['gram-suggest'][0]['options']])


@app.route('/related-keywords/{keywords}', methods=['GET'])
def related(keywords):
    terms = []
    for t in keywords.split(','):
        for t1 in t.split():
            if t1 in word_vecs.vocab:
                terms.append(t1)

    if len(terms) > 0:
        related = word_vecs.most_similar(terms, [])
        print(related)
        return JSONResponse([r[0] for r in related])
    else:
        return JSONResponse([])


query = lambda term: MultiMatch(query=term, fields=['title', 'abstract'], type='phrase')

async def search_elastic(toggle, terms=None, fields=('title', 'abstract'), sort=False):

    s = Search(using=es)

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
    
        q = MultiMatch(query=terms.pop(0), fields=['title', 'abstract'], type='phrase')
        # take union of all matching queries
        for term in terms:
            if toggle:
                q = q & MultiMatch(query=term, fields=['title', 'abstract'], type='phrase')
            else:
                q = q | MultiMatch(query=term, fields=['title', 'abstract'], type='phrase')

        s = s.query(q)


    if sort:
        s.aggs.bucket('per_division', 'terms', field='division', order={'agg_grants': 'desc'}, size=80) \
            .metric('agg_grants', 'value_count', field='date') \
            .metric('agg_amount', 'sum', field='amount')

    else:
        s.aggs.bucket('per_year', 'date_histogram', field='date', interval='year') \
            .bucket('per_division', 'terms', field='division', size=80) \
            .metric('agg_grants', 'value_count', field='date') \
            .metric('agg_amount', 'sum', field='amount')

    #return s.execute().aggregations
    #logger.info(json.dumps(s.to_dict(), indent=2))

    return await asyncio.gather(
            aioes.search(index='nsf', body=per_year),
            aioes.search(index='nsf', body=per_division),
            aioes.search(index='nsf', body=sum_total),
        )


@app.route('/grants', methods=['POST'])
async def grant_data(request: Request):

    body = await request.json()
    idx = body['idx']
    terms = body['terms']
    fields = body['fields']
    divisions = body['divisions']
    toggle = body['boolQuery'] == 'all'

    grants = {
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
            }
        }

    response = await aioes.search(index='nsf', body=grants)

    if response['hits']['total'] == 0:
        raise HTTPException(404, detail='index out of bounds')

    grants = []
    for hit in response['hits']['hits']:
        grants.append({
                'score': hit['_score'],
                'id': hit['_id'],
                **hit['_source'],
            })
            
    
    return JSONResponse(grants)
 
    #q = MultiMatch(query=terms.pop(0), fields=['title', 'abstract'], type='phrase')
    ## take union of all matching queries
    #for term in j['terms']:
    #    if j['toggle']:
    #        q = q & MultiMatch(query=term, fields=['title', 'abstract'], type='phrase')
    #    else:
    #        q = q | MultiMatch(query=term, fields=['title', 'abstract'], type='phrase')

    #s = Search(using=es).query(q)

    return 'title,date,value,division,id\n' + '\n'.join([
            ','.join([
                    "'{}'".format(r.title.replace("'", "''")),
                    str(r.date),
                    str(r.amount),
                    r.division,
                    r.meta.id
                ]) for r in s.scan() if r.division in j['divisions']
        ])


@app.route('/abstract/{_id}/{terms}', methods=['GET'])
async def get_abstract(_id, terms):
    query = {
            'query': {
                'terms': {
                    '_id': [_id]
                }
            },
            'highlight': {
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
    return response['hits']['hits'][0]['highlight']['abstract'][0]

app.mount('/data', app)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='localhost', port=8888, log_level='info')
