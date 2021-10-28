import os
from pathlib import Path
from typing import List
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

from models import Division, Grant, GrantsRequest, SearchRequest, SearchResponse, Term, YearsResponse
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
    global aioes, ASSETS_DIR, word_vecs
    # look for the environment variable ELASTICSEARCH_HOST. if not set, use default 'localhost'
    host = os.environ.get('ELASTICSEARCH_HOST', 'localhost')
    aioes = Elasticsearch([{"host": host}])
    ASSETS_DIR = os.environ.get('ASSETS_DIR', 'assets')
    ASSETS_DIR = Path(ASSETS_DIR)
    path_to_model = ASSETS_DIR.joinpath('nsf_w2v_model')
    word_vecs = Word2Vec.load(str(path_to_model)).wv


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
    # ! DEPRECATED

    if toggle not in ('any', 'all'):
        raise HTTPException(404, detail='toggle not valid')

    if type(terms) is str:
        terms = terms.split(',')

    with open(ASSETS_DIR.joinpath('divisions.csv'), 'r') as divs:
        divisions = [{
                'title': d.strip()[:-2],
                'default': d.strip()[-1] == 'y'
            } for i, d in enumerate(divs.readlines())]

    # return render_template('index.html', toggle=toggle, divisions=divisions, terms=terms)


@app.get('/divisions', operation_id='loadDivisions', response_model=List[Division])
async def divisions():
    # return FileResponse(ASSETS_DIR.joinpath('divisions.json'))
    return Q.get_divisions()


@app.post('/search', operation_id='search', response_model=SearchResponse)
async def search(request: SearchRequest):

    toggle = (request.boolQuery == 'all')

    return await Q.division_aggregates(
        aioes,
        toggle,
        terms=request.terms,
        year_range=request.year_range,
        fields=request.fields
    )


@app.post('/years', operation_id='years', response_model=YearsResponse)
async def years(request: SearchRequest):

    toggle = (request.boolQuery == 'all')

    return await Q.year_aggregates(
        aioes,
        toggle,
        terms=request.terms,
        fields=request.fields
    )


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


@app.post('/grants', operation_id='loadGrants', response_model=List[Grant])
async def grant_data(request: GrantsRequest):

    try:
        return await Q.grants(
            aioes,
            idx=request.idx,
            toggle=request.toggle,
            order_by=request.order_by,
            order=request.order,
            divisions=request.divisions,
            fields=request.fields,
            terms=request.terms,
            year_range=request.year_range,
        )
    except Exception as e:
        print(e)
        raise HTTPException(404, detail='index out of bounds')
        

@app.get('/abstract/{_id}/{terms}', operation_id='loadAbstract', response_model=str)
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
