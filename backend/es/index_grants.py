from elasticsearch_dsl import (
    Document,
    Date,
    Keyword,
    Text,
    Index,
    connections,
    analyzer
)
from elasticsearch.helpers import bulk
from elasticsearch_dsl.analysis import token_filter
from elasticsearch_dsl.field import Integer
from tqdm import tqdm
import mysql.connector as conn

es = connections.create_connection(hosts=['localhost'], timeout=20)

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


def get_data():
    db = conn.connect(database="nsf",
        user="nsf",
        password="!DLnsf333",
        host="localhost")

    cur = db.cursor()
    cur.execute("select AwardTitle, AbstractNarration, AwardAmount, AwardEffectiveDate, LongName from Award join Division on Award.AwardID = Division.AwardID")

    Grant.init()

    for r in tqdm(cur.fetchall()):
        g = Grant(title=r[0], abstract=r[1], amount=r[2], date=r[3], division=r[4])
        yield g.to_dict(True)
        
    
def build_index():
    nsf.delete()
    nsf.create()

    bulk(es, get_data())
    

if __name__ == '__main__':
    build_index()