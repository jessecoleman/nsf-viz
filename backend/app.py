import csv
import io
import os
from pathlib import Path
from typing import List, Union
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from gensim.models.word2vec import Word2Vec
from gensim.models import KeyedVectors
import logging
import json
from functools import lru_cache
from aioelasticsearch import Elasticsearch
from aioelasticsearch.helpers import Scan

import queries as Q
from models import (
    Directory,
    Division,
    Grant,
    GrantsRequest,
    SearchRequest,
    SearchResponse,
    YearsResponse
)

app = FastAPI(servers=[{'url': '/data'}])
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*']
)
# app.debug = True

#logging.basicConfig(level=logging.DEBUG)
# logger = logging.getLogger('uvicorn')
root_logger = logging.getLogger()
# logger = root_logger.getChild(__name__)
logger = root_logger.getChild('uvicorn')
# from fastapi.logger import logger
# root_logger.setLevel('DEBUG')
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logger.setLevel(log_level)


aioes = None
word_vecs = None

def load_word_vecs(path_to_model: Union[str, Path]) -> KeyedVectors:
    # if the model is a '.txt' file, assume it is a text keyed vectors file
    # otherwise, assume it is a full word2vec model file
    # we'll probably want to change this
    path_to_model = Path(path_to_model)
    logger.info(f"loading similarity model from {path_to_model}")
    if path_to_model.suffix == '.txt':
        return KeyedVectors.load_word2vec_format(str(path_to_model), binary=False)
    else:
        return Word2Vec.load(str(path_to_model)).wv

@app.on_event('startup')
async def startup():
    global aioes, ASSETS_DIR, word_vecs
    # look for the environment variable ELASTICSEARCH_HOST. if not set, use default 'localhost'
    host = os.environ.get('ELASTICSEARCH_HOST', 'localhost')
    aioes = Elasticsearch([{"host": host}])
    ASSETS_DIR = os.environ.get('ASSETS_DIR', 'assets')
    ASSETS_DIR = Path(ASSETS_DIR)
    MODEL_FILENAME = os.environ.get('WORD_VECTORS_FILENAME', '')
    if not MODEL_FILENAME:
        MODEL_FILENAME = 'nsf_w2v_model'  # default value
    # path_to_model = ASSETS_DIR.joinpath('combined_nsfandnih_scispacy_entity_vectors.txt')
    path_to_model = ASSETS_DIR.joinpath(MODEL_FILENAME)
    try:
        # word_vecs = Word2Vec.load(str(path_to_model)).wv
        word_vecs = load_word_vecs(path_to_model)
    except FileNotFoundError:
        logger.warning(f"No such file or directory: '{path_to_model}'. Skipping loading Word2Vec model")
        word_vecs = Word2Vec()
    logger.error(f"logLevel: {logger.level}")
    logger.error(f"root logLevel: {root_logger.level}")
    logger.error('error logger')
    logger.info('info logger')
    logger.debug('debug logger')


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


@app.get('/divisions', operation_id='loadDivisions', response_model=List[Division])
async def divisions():
    # return FileResponse(ASSETS_DIR.joinpath('divisions.json'))
    return Q.get_divisions()


@app.get('/divisions/{org}', operation_id='loadDivisions', response_model=List[Division])
async def divisions(org: str):
    return FileResponse(f'assets/{org}_divisions.json')


@app.get('/directory/{org}', operation_id='loadDirectory', response_model=List[Directory])
async def divisions(org: str):
    return FileResponse(f'assets/{org}_directory.json')


@app.post('/search', operation_id='search', response_model=SearchResponse)
async def search(request: SearchRequest):

    return await Q.division_aggregates(
        aioes,
        intersection=request.intersection,
        terms=request.terms,
        start=request.start,
        end=request.end,
        match=request.match,
        org=request.org,
    )


@app.post('/years', operation_id='years', response_model=YearsResponse)
async def years(request: SearchRequest):

    return await Q.year_aggregates(
        aioes,
        intersection=request.intersection,
        terms=request.terms,
        match=request.match,
        org=request.org,
    )


@app.get('/keywords/typeahead/{prefix}', operation_id='loadTypeahead')
async def typeahead(prefix: str):

    return await Q.typeahead(aioes, prefix)


@app.get('/keywords/related/{keywords}', operation_id='loadRelated')
def related(keywords: str):

    terms = []
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
        grants = Q.grants(
            aioes,
            idx=request.idx,
            org=request.org,
            intersection=request.intersection,
            order_by=request.order_by,
            order=request.order,
            divisions=request.divisions,
            match=request.match,
            terms=request.terms,
            start=request.start,
            end=request.end,
        )

        return [grant async for grant in grants]

    except IndexError:
        raise HTTPException(404, detail='index out of bounds')


@app.post('/grants/download', operation_id='downloadGrants')
async def grant_data(request: GrantsRequest):

    try:
        grants = Q.grants(
            aioes,
            idx=0,
            limit=10000,
            org=request.org,
            intersection=request.intersection,
            order_by=request.order_by,
            order=request.order,
            divisions=request.divisions,
            match=request.match,
            terms=request.terms,
            start=request.start,
            end=request.end,
            include_abstract=True,
        )

        class DummyWriter:
            def write(self, line):
                return line

        async def stream_grants_csv():
            writer = csv.DictWriter(DummyWriter(), fieldnames=[
                'agency',
                'division',
                'grant_id',
                'title',
                'date',
                'amount',
                'abstract'
            ], extrasaction='ignore')
            yield writer.writeheader()
            async for grant in grants:
                yield writer.writerow({
                    **grant.dict(),
                    'division': grant.cat1_raw,
                })

        response = StreamingResponse(content=stream_grants_csv(), media_type='text/csv')
        response.headers['Content-Disposition'] = 'attachment; filename=grants.csv'
        return response

    except IndexError:
        raise HTTPException(404, detail='index out of bounds')
        

@app.get('/abstract/{_id}/')
@app.get('/abstract/{_id}/{terms}', operation_id='loadAbstract', response_model=str)
async def get_abstract(_id, terms=""):
    logger.debug(f"terms: {terms}")
    return await Q.abstract(aioes, _id, terms)


@app.get('/generate_openapi_json')
async def send_api_json():

    return app.openapi()


app.mount('/data', app)

if __name__ == '__main__':
    logger.error("MAIN")
    import uvicorn
    import argparse
    # handler = logging.StreamHandler()
    # handler.setFormatter(
    #     logging.Formatter(
    #         fmt="%(asctime)s %(name)s.%(lineno)d %(levelname)s : %(message)s",
    #         datefmt="%H:%M:%S",
    #     )
    # )
    # root_logger.addHandler(handler)
    # root_logger.setLevel(logging.INFO)
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default='localhost')
    parser.add_argument("-p", "--port", type=int, default=8888)
    parser.add_argument("--log-level")
    args = parser.parse_args()
    app.servers = [{ 'url': 'http://localhost:8888' }]
    with open('api.json', 'w') as api:
        json.dump(app.openapi(), api)
    dev_mode = os.environ.get('DEV_MODE')
    log_level = args.log_level
    if not log_level:
        log_level = os.environ.get('LOG_LEVEL', 'info')
    # root_logger.setLevel(log_level.upper())
    if dev_mode:
        uvicorn.run("app:app", host=args.host, port=args.port, log_level=log_level.lower(), reload=True)
    else:
        uvicorn.run(app, host=args.host, port=args.port, log_level=log_level.lower())
