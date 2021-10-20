import os
import json
import csv
from pathlib import Path
from typing import Generator, Iterable, List, Mapping, Optional, Union
from elasticsearch_dsl import (
    Document,
    Date,
    Keyword,
    Text,
    Integer,
    Index,
    connections,
    analyzer,
)
from elasticsearch.helpers import bulk
from elasticsearch_dsl.analysis import token_filter
from tqdm import tqdm
import mysql.connector as conn

host = os.environ.get("ELASTICSEARCH_HOST", "localhost")
es = connections.create_connection(hosts=[host], timeout=20)
index_name = os.environ.get("ELASTICSEARCH_GRANT_INDEX", "grants")

es_index = Index(index_name)
es_index.settings(
    number_of_shards=8,
    number_of_replicas=2,
)

english_stop = token_filter("english_stop", type="stop", stopwords="_english_")

english_possessive_stemmer = token_filter(
    "english_stemmer", type="stemmer", language="english"
)

english_stemmer = token_filter("english_stemmer", type="stemmer", language="english")

aggressive_analyzer = analyzer(
    "aggressive_analyze",
    tokenizer="standard",
    filter=[
        "lowercase",
        english_possessive_stemmer,
        english_stemmer,
        english_stop,
        "asciifolding",
    ],
)


@es_index.document
class Grant(Document):
    # see also: Grant class in models.py
    title = Text(fields={"raw": Keyword()})
    abstract = Text(term_vector="with_positions_offsets", analyzer=aggressive_analyzer)
    date = Date()
    amount = Integer()
    division = Keyword()
    division_key = Keyword()


# DEPRECATED
def data_source_mysql() -> List:
    db = conn.connect(
        database="nsf", user="nsf", password="!DLnsf333", host="localhost"
    )

    cur = db.cursor()
    cur.execute(
        "select AwardTitle, AbstractNarration, AwardAmount, AwardEffectiveDate, LongName from Award join Division on Award.AwardID = Division.AwardID"
    )

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


def get_data(data_source: Iterable, div_map: Optional[Mapping] = None) -> Generator:

    if div_map is None:
        script_dir = os.path.dirname(os.path.realpath(__file__))
        divisions_fpath = os.path.join(script_dir, "../assets/divisions.json")
        with open(divisions_fpath) as div_file:
            divs = json.load(div_file)
            div_map = {d["name"].lower(): d["key"] for d in divs}

    Grant.init()

    for r in tqdm(data_source):
        try:
            g = Grant(
                title=r[0],
                abstract=r[1],
                amount=r[2],
                date=r[3],
                division=r[4],
                division_key=div_map[r[4].lower()],
            )
            yield g.to_dict(True)
        except KeyError:
            continue


def build_index(data_source: Iterable):
    if es_index.exists():
        es_index.delete()
    es_index.create()

    bulk(es, get_data(data_source=data_source))


def main(args):
    if args.data_source.lower() == "mysql":
        data_source = data_source_mysql()
        build_index(data_source=data_source)
    elif args.data_source.endswith(".csv"):
        data_source = data_source_csv(args.data_source)
        build_index(data_source=data_source)
    else:
        raise ValueError('invalid value for argument "data-source"')


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--data-source",
        default="mysql",
        help="Source for data (default: mysql database)",
    )
    global args
    args = parser.parse_args()
    main(args)
