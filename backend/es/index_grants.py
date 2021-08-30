import os
import json
from elasticsearch_dsl import (
    Document,
    Date,
    Keyword,
    Text,
    Integer,
    Index,
    connections,
    analyzer
)
from elasticsearch.helpers import bulk
from elasticsearch_dsl.analysis import token_filter
from tqdm import tqdm
import mysql.connector as conn

host = os.environ.get('ELASTICSEARCH_HOST', 'localhost')
es = connections.create_connection(hosts=[host], timeout=20)

nsf = Index('nsf-dev')
nsf.settings(
        number_of_shards=8,
        number_of_replicas=2,
    )

english_stop = token_filter(
    'english_stop',
    type='stop',
    stopwords='_english_'
)

english_possessive_stemmer = token_filter(
    'english_stemmer',
    type='stemmer',
    language='english'
)

english_stemmer = token_filter(
    'english_stemmer',
    type='stemmer',
    language='english'
)

aggressive_analyzer = analyzer(
    'aggressive_analyze',
    tokenizer='standard',
    filter=[
        'lowercase',
        english_possessive_stemmer,
        english_stemmer,
        english_stop,
        'asciifolding'
    ]
)

@nsf.document
class Grant(Document):
    title = Text(fields={'raw': Keyword()})
    abstract = Text(term_vector='with_positions_offsets', analyzer=aggressive_analyzer)
    date = Date()
    amount = Integer()
    division = Keyword()
    division_key = Keyword()


def get_data():
    db = conn.connect(database="nsf",
        user="nsf",
        password="!DLnsf333",
        host="localhost")

    cur = db.cursor()
    cur.execute("select AwardTitle, AbstractNarration, AwardAmount, AwardEffectiveDate, LongName from Award join Division on Award.AwardID = Division.AwardID")
    
    with open('../assets/divisions.json') as div_file:
        divs = json.load(div_file)
        div_map = {d['name'].lower(): d['key'] for d in divs}

    Grant.init()

    for r in tqdm(cur.fetchall()):
        g = Grant(
            title=r[0],
            abstract=r[1],
            amount=r[2],
            date=r[3],
            division=r[4],
            division_key=div_map[r[4].lower()],
        )
        yield g.to_dict(True)
        
    
def build_index():
    if nsf.exists():
        nsf.delete()
    nsf.create()

    bulk(es, get_data())
    

if __name__ == '__main__':
    build_index()