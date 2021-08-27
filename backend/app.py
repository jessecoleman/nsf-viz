import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException
from fastapi.responses import FileResponse
from gensim.models.word2vec import Word2Vec
import logging
import json
from functools import lru_cache
from collections import defaultdict
from aioelasticsearch import Elasticsearch
from aioelasticsearch.helpers import Scan

from models import GrantsRequest, SearchRequest, SearchResponse, Term
import queries as Q

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
    word_vecs = Word2Vec.load('assets/nsf_fasttext_model').wv


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

    with open('assets/divisions.csv', 'r') as divs:
        divisions = [{
                'title': d.strip()[:-2],
                'default': d.strip()[-1] == 'y'
            } for i, d in enumerate(divs.readlines())]

    # return render_template('index.html', toggle=toggle, divisions=divisions, terms=terms)


@app.get('/divisions', operation_id='loadDivisions')
async def divisions():
    return FileResponse('assets/divisions.json')


@app.post('/search', operation_id='search', response_model=SearchResponse)
async def search(request: SearchRequest):

    toggle = (request.boolQuery == 'all')

    if len(request.terms) == 0:
        return SearchResponse(
            per_year=[],
            per_division=[],
            sum_total=[]
        )

    per_year, per_division, sum_total = await Q.year_division_aggregates(aioes, toggle, request.terms)

    return SearchResponse(
        per_year=per_year['aggregations']['years']['buckets'],
        per_division=per_division['aggregations']['years']['buckets'],
        sum_total=sum_total['aggregations']['divisions']['buckets'],
    )

    matched = await Q.year_division_aggregates(aioes, toggle, terms)
    order = await Q.year_division_aggregates(aioes, toggle, terms, sort=True)

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

    return await Q.typeahead(aioes, prefix)


@app.get('/keywords/related/{keywords}', operation_id='loadRelated')
def related(keywords: str):
    terms = []
    print(keywords)
    for term in keywords.split(','):
        # convert to ngram representation
        term = term.lower().replace(' ', '_')
        if word_vecs.key_to_index.get(term, False):
            terms.append(term)

    if len(terms) > 0:
        # convert back
        return [w[0].replace('_', ' ') for w in word_vecs.most_similar(terms, [], topn=15)]
    else:
        return []


@app.get('/keywords/count/{terms}', operation_id='countTerm')
async def count_term(terms: str):
    counts = await Q.term_freqs(aioes, terms.split(','), ['title', 'abstract'])
    return [c['count'] for c in counts]


@app.post('/grants', operation_id='loadGrants')
async def grant_data(request: GrantsRequest):

    try:
        return await Q.grants(
            aioes,
            request.idx,
            request.toggle,
            request.order_by,
            request.order,
            request.fields,
            request.terms
        )
    except Exception:
        raise HTTPException(404, detail='index out of bounds')
        

@app.get('/abstract/{_id}/{terms}', operation_id='loadAbstract')
async def get_abstract(_id, terms):
    return await Q.abstract(aioes, _id, terms)


@app.get('/generate_openapi_json')
async def send_api_json():
    return app.openapi()


app.mount('/data', app)

if __name__ == '__main__':
    import uvicorn
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default='localhost')
    parser.add_argument("-p", "--port", type=int, default=8888)
    parser.add_argument("--log-level", default='info')
    args = parser.parse_args()
    app.servers = [{ 'url': 'http://localhost:8888' }]
    with open('api.json', 'w') as api:
        json.dump(app.openapi(), api)
    dev_mode = os.environ.get('DEV_MODE')
    if dev_mode:
        uvicorn.run("app:app", host=args.host, port=args.port, log_level=args.log_level, reload=True)
    else:
        uvicorn.run(app, host=args.host, port=args.port, log_level=args.log_level)
