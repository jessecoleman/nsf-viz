"""
entrypoint for backend API layer
"""
from __future__ import division
import csv
import os
from pathlib import Path
import random
import re
from typing import Dict, List, Optional, Union
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from gensim.models.word2vec import Word2Vec
from gensim.models.phrases import Phraser
from gensim.models import KeyedVectors
import logging
import json
from functools import lru_cache
from aioelasticsearch import Elasticsearch

import queries as Q
import analyze

from models import (
    Directory,
    Division,
    Grant,
    SearchResponse,
    Term,
    TermTopic,
    Topic,
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
phrases: Phraser = None

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


def load_phrases(
    bigrams_path: Union[str, Path],
    trigrams_path: Optional[Union[str, Path]] = None,
) -> Phraser:
    
    bigrams = Phraser.load(f'./{bigrams_path}')
    # TODO
    #if trigrams_path:
    #    trigrams = Phraser.load(trigrams_path)
    #else:
    #    trigrams = None
    
    return bigrams
    

@app.on_event('startup')
async def startup():
    global aioes, ASSETS_DIR, word_vecs, phrases
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
    print(path_to_model)
    try:
        word_vecs = load_word_vecs(path_to_model)
    except FileNotFoundError:
        logger.warning(f"No such file or directory: '{path_to_model}'. Skipping loading Word2Vec model")
        word_vecs = Word2Vec()
        
    try:
        MODEL_FILENAME = os.environ.get('BIGRAMS_FILENAME', 'bigrams.bin')
        path_to_phrases = ASSETS_DIR.joinpath(MODEL_FILENAME)
        phrases = load_phrases(path_to_phrases)
    except FileNotFoundError:
        logger.warning(f"No such file or directory: '{path_to_phrases}'. Skipping loading Phrases model")

    logger.error(f"logLevel: {logger.level}")
    logger.error(f"root logLevel: {root_logger.level}")
    logger.error('error logger')
    logger.info('info logger')
    logger.debug('debug logger')


@app.on_event('shutdown')
async def shutdown():
    await aioes.close()


@app.get('/divisions', operation_id='loadDivisions', response_model=List[Division])
async def divisions():
    # return FileResponse(ASSETS_DIR.joinpath('divisions.json'))
    return Q.get_divisions()


@app.get('/divisions/{org}', operation_id='loadDivisions', response_model=List[Division])
async def divisions(org: str):
    return FileResponse(f'assets/{org}_divisions.json')


@app.get('/topics', operation_id='getTopics', response_model=List[Topic])
async def get_topics():
    with open('assets/topics.json', 'r') as topics_file:
        all_topics = json.load(topics_file)
        topics = random.sample(all_topics, 5)
        
        return [Topic(
            terms=[
                TermTopic(term=term.replace('_', ' '), count=count)
                for term, count in topic[:20]
            ]
        ) for topic in topics]


@app.get('/directory/{org}', operation_id='loadDirectory', response_model=List[Directory])
async def divisions(org: str):
    return FileResponse(f'assets/{org}_directory.json')


@app.get('/search', operation_id='search', response_model=SearchResponse)
async def search(
    org: str,
    start: Optional[int] = None,
    end: Optional[int] = None,
    terms: List[str] = Query(None),
    match: Optional[List[str]] = Query(None),
    intersection: Optional[bool] = False,
):

    return await Q.division_aggregates(
        aioes,
        org=org,
        terms=terms,
        start=start,
        end=end,
        match=match,
        intersection=intersection,
    )


@app.get('/years', operation_id='years', response_model=YearsResponse)
async def years(
    org: str,
    terms: List[str] = Query(None),
    divisions: List[str] = Query(None),
    match: Optional[List[str]] = Query(None),
    intersection: Optional[bool] = False,
):

    return await Q.year_aggregates(
        aioes,
        intersection=intersection,
        terms=terms,
        divisions=divisions,
        match=match,
        org=org,
    )


@app.get('/keywords/typeahead/{prefix}', operation_id='loadTypeahead', response_model=List[Term])
async def typeahead(prefix: str, selected_terms: List[str] = Query(None)):

    terms = await Q.typeahead(aioes, prefix)
    # for term in terms:
    #     for t in selected_terms:
    #         
    #     
    # print(word_vecs.similarity)
    # most_similar(indexed_terms, topn=15))
    # weights = []
    return terms


@app.get('/keywords/related', operation_id='loadRelated', response_model=List[Term])
def related(terms: List[str] = Query(None)):

    # TODO https://radimrehurek.com/gensim/auto_examples/tutorials/run_annoy.html
    print(terms)
    terms = [t.strip('~') for t in terms]
    indexed_terms = analyze.get_indexed_terms(terms, word_vecs)

    print(indexed_terms)
    print(word_vecs.most_similar(indexed_terms, topn=15))
    if len(indexed_terms) > 0:
        # convert back
        return [Term(
            term=w[0].replace('_', ' '),
            stem='',
            forms=[]
        ) for w in word_vecs.most_similar(indexed_terms, topn=15)]
    else:
        return []


@app.get('/keywords/count', operation_id='loadTermCounts', response_model=Dict[str, int])
async def count_terms(
    org: str,
    match: List[str] = Query(['title', 'abstract']),
    terms: List[str] = Query(None)
):
    
    terms = [term.strip('~') for term in terms]

    counts = await Q.term_freqs(
        aioes, 
        org=org,
        terms=terms,
        match=match
    )

    return dict(zip(terms, [c['count'] for c in counts]))


@app.get('/grants', operation_id='loadGrants', response_model=List[Grant])
async def grant_data(
    idx: int,
    org: str,
    start: Optional[int] = None,
    end: Optional[int] = None,
    divisions: List[str] = Query(None),
    match: List[str] = Query(['title', 'abstract']),
    terms: List[str] = Query(None),
    sort: Optional[str] = 'title',
    order: Optional[str] = 'desc',
    intersection: Optional[bool] = False,
):

    grants = Q.grants(
        aioes,
        idx=idx,
        org=org,
        intersection=intersection,
        sort=sort,
        order=order,
        divisions=divisions,
        match=match,
        terms=terms,
        start=start,
        end=end,
    )

    response = [grant async for grant in grants]

    if len(response) == 0:
        raise HTTPException(404, detail='index out of bounds')
    
    return response


@app.get('/grants/download', operation_id='downloadGrants')
async def grant_download(
    org: str,
    start: Optional[int] = None,
    end: Optional[int] = None,
    divisions: List[str] = Query(None),
    match: List[str] = Query(['title', 'abstract']),
    terms: List[str] = Query(None),
    sort: Optional[str] = 'title',
    order: Optional[str] = 'desc',
    intersection: Optional[bool] = False,
):

    try:
        grants = Q.grants(
            aioes,
            idx=0,
            limit=10000,
            org=org,
            intersection=intersection,
            sort=sort,
            order=order,
            divisions=divisions,
            match=match,
            terms=terms,
            start=start,
            end=end,
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
        

@app.get('/abstract/{_id}', operation_id='loadAbstract', response_model=Grant)
async def get_abstract(_id, terms: List[str] = Query([]), beta: bool = None):
    logger.debug(f"terms: {terms}")
    grant = await Q.abstract(aioes, _id, terms)

    if beta:
        most_related = analyze.get_related(
            grant.abstract,
            terms,
            phrases,
            word_vecs
        )
        # counts = await count_terms(
        #     org='nsf',
        #     terms=most_related,
        #     match=['title', 'abstract']
        # )

        grant2 = await Q.abstract(aioes, _id, terms + most_related)
        grant.abstract = merge_abstracts(grant.abstract, grant2.abstract)

    return grant


def merge_abstracts(a1: str, a2: str):

    matches = []
    for match in re.finditer(r'<em>([^<]*)</em>', a1):
        matches.append(match.group(1))

    for match in re.finditer(r'<em>([^<]*)</em>', a2):
        phrase = match.group(1)
        if phrase not in matches:
            matches.append(phrase)
            a2 = a2.replace(match.group(0), f'<i>{phrase}</i>')

    return a2


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
