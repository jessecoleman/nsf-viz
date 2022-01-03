from collections import Counter, defaultdict
import os
import json
import csv
from pathlib import Path
from typing import Generator, Iterable, List, Union
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
from gen_keys import normalize
import urllib.parse


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
    key1 = Keyword()
    key2 = Keyword()


def data_source_mysql() -> List:
    db = conn.connect(database="nsf",
        user="nsf",
        password="!DLnsf333",
        host="localhost")

    cur = db.cursor()
    cur.execute("select AwardTitle, AbstractNarration, AwardAmount, AwardEffectiveDate, LongName from Award join Division on Award.AwardID = Division.AwardID")

    return cur.fetchall()

def data_source_csv(fpath: Union[str, Path]) -> Generator:
    # csv schema is: 'idx,AwardTitle,AbstractNarration,AwardAmount,AwardEffectiveDate,DivisionCode,DivisionLongName'
    fpath = Path(fpath)
    with fpath.open() as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if i == 0:
                # header row
                continue

            yield [
                row[1],  # title
                row[2],  # abstract
                row[3],  # amount
                row[4],  # date
                row[6],  # division name
            ]


def get_data(data_source: Iterable):
    
    #with open('../assets/nsf_divisions.json') as div_file:
    #    divs = json.load(div_file)
    #    div_map = {d['name'].lower(): d['key'] for d in divs}

    with open('./associated.json') as div_file:
        divs = json.load(div_file)
        div_map = {normalize(key): (d['parent'], d['abbr']) for key, d in divs.items()}

    Grant.init()

    missing = Counter()
    count = defaultdict(Counter)

    for i, (title, abstract, amount, date, div) in enumerate(tqdm(data_source)):

        normed = normalize(div)
        count[normed][div] += 1

        if normed not in div_map:
            missing[div] += 1
        else:
            key1, key2 = div_map[normed]
            g = Grant(
                title=title,
                abstract=abstract,
                amount=amount,
                date=date,
                division=div,
                key1=key1,
                key2=key2,
            )
            yield g.to_dict(True)
        
    with open('norm_map.json', 'w') as nm:
        print(missing)
        json.dump(count, nm)

    
def build_index(data_source: Iterable):
    if nsf.exists():
        nsf.delete()
    nsf.create()

    bulk(es, get_data(data_source=data_source))

    
def main(args):
    if args.data_source.lower() == 'mysql':
        data_source = data_source_mysql()
        build_index(data_source=data_source)
    elif args.data_source.endswith('.csv'):
        data_source = data_source_csv(args.data_source)
        build_index(data_source=data_source)
    else:
        raise ValueError('invalid value for argument "data-source"')


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-source", default='mysql', help="Source for data (default: mysql database)")
    global args
    args = parser.parse_args()
    main(args)