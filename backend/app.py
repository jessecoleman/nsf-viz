import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException
from gensim.models.word2vec import Word2Vec
import logging
import json
from functools import lru_cache
from collections import defaultdict
from aioelasticsearch import Elasticsearch
from aioelasticsearch.helpers import Scan

from models import GrantsRequest, SearchRequest
from queries import search_elastic

#logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('uvicorn')

app = FastAPI(servers=[{'url': '/data'}])
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*']
)
app.debug = True

aioes = None
word_vecs = None

@app.on_event('startup')
async def startup():
    global aioes, word_vecs
    # look for the environment variable ELASTICSEARCH_HOST. if not set, use default 'localhost'
    host = os.environ.get('ELASTICSEARCH_HOST', 'localhost')
    aioes = Elasticsearch([{"host": host}])
    word_vecs = Word2Vec.load('assets/nsf_w2v_model').wv


@app.on_event('shutdown')
async def shutdown():
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


@app.get('/')
@app.get('/<toggle>/<terms>')
def main(toggle='any', terms=default_terms):

    if toggle not in ('any', 'all'):
        raise HTTPException(404, detail='toggle not valid')

    if type(terms) is str:
        terms = terms.split(',')

    with open('static/divisions.csv', 'r') as divs:
        divisions = [{
                'title': d.strip()[:-2],
                'default': d.strip()[-1] == 'y'
            } for i, d in enumerate(divs.readlines())]

    # return render_template('index.html', toggle=toggle, divisions=divisions, terms=terms)


@app.get('/divisions', operation_id='loadDivisions')
async def divisions():
    with open('assets/divisions.csv', 'r') as divs:
        divisions = [{
                'title': d.strip()[:-2],
                'selected': d.strip()[-1] == 'y'
            } for d in divs.readlines()]
        
        return divisions


@app.post('/search', operation_id='search')
async def search(request: SearchRequest):

    #dependent = body.get('dependant')

    toggle = (request.boolQuery == 'all')

    if request.terms is None:
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

    per_year, per_division, sum_total = await search_elastic(aioes, toggle, request.terms)
    return {
            'per_year': per_year,
            'per_division': per_division,
            'sum_total': sum_total,
        }

    matched = await search_elastic(aioes, toggle, terms)
    order = await search_elastic(aioes, toggle, terms, sort=True)

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


@app.get('/keywords/typeahead/{prefix}', operation_id='loadTypeahead')
async def typeahead(prefix: str):

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

    return [
        g['_source']['gram']
        for g in result['suggest']['gram-suggest'][0]['options']
    ]


@app.get('/keywords/related/{keywords}', operation_id='loadRelated')
def related(keywords):
    terms = []
    for t in keywords.split(','):
        for t1 in t.split():
            if t1 in word_vecs.vocab:
                terms.append(t1)

    if len(terms) > 0:
        related = word_vecs.most_similar(terms, [])
        return [r[0] for r in related]
    else:
        return []


@app.post('/grants', operation_id='loadGrants')
async def grant_data(request: GrantsRequest):

    grants = {
            'size': 50,
            'from': request.idx,
            'query': {
                'bool': {
                    #'filter': [
                    #    {
                    #            
                    #],
                    ('must' if request.toggle else 'should'): [
                        {
                            'multi_match': {
                                'fields': request.fields,
                                'query': term,
                                'type': 'phrase',
                            }
                        }
                    for term in request.terms]
                }
            },
            'sort': [
                {
                    request.order_by: {
                        'order': request.order
                    }
                }
            ]
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
            
    return grants
 

@app.get('/abstract/{_id}/{terms}', operation_id='loadAbstract')
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
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default='localhost')
    parser.add_argument("-p", "--port", type=int, default=8888)
    parser.add_argument("--log-level", default='info')
    args = parser.parse_args()
    with open('api.json', 'w') as api:
        json.dump(app.openapi(), api)
    uvicorn.run(app, host=args.host, port=args.port, log_level=args.log_level)
