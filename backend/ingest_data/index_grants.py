import os
import json
import csv
import dateutil.parser
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

# ================== CATEGORIES / ABBREVIATIONS ============

FILENAME_ABBREVIATIONS = "abbreviations.json"
FILENAME_NSF_MAPPED = 'mapped.json'

def normalize(div: str):
    normed = []
    for w in div.split():
        if (w[0].isalpha() and w.lower() not in ('of', 'and', 'for', '&')
            and not (w.lower().startswith('div') and not w.lower() == 'diversity')
            and not w.lower().startswith('office')
            and not w.lower().startswith('direct')):

            normed.append(w.lower())

    return ' '.join(normed)

script_dirpath = Path(os.path.dirname(os.path.realpath(__file__)))

fp = script_dirpath.joinpath(FILENAME_ABBREVIATIONS)
abbrevs = json.loads(fp.read_text())

fp = script_dirpath.joinpath(FILENAME_NSF_MAPPED)
nsf_mapped = json.loads(fp.read_text())


nsf_mapped_reversed = {}
for k, v in nsf_mapped.items():
    for item in v:
        assert item not in nsf_mapped_reversed.keys()
        nsf_mapped_reversed[item] = k

abbrevs_flat = {}
for agency, v in abbrevs.items():
    for abbrev, longname in v.items():
        assert longname not in abbrevs_flat.keys()
        abbrevs_flat[normalize(longname)] = abbrev.lower()

# /================== CATEGORIES / ABBREVIATIONS ============

@es_index.document
class Grant(Document):
    # see also: Grant class in models.py
    grant_id = Keyword()
    agency = Keyword()
    title = Text(fields={"raw": Keyword()})
    abstract = Text(term_vector="with_positions_offsets", analyzer=aggressive_analyzer)
    date = Date()
    amount = Integer()
    # TODO there will be hierarchical categories, up to 3 (e.g., Division, Subdivision)
    # for now, there is just one level, in cat1
    cat1 = Keyword()
    cat1_raw = Keyword()
    cat2 = Keyword()
    cat2_raw = Keyword()
    cat3 = Keyword()
    cat3_raw = Keyword()

def format_date(date_str: str) -> str:
    dt = dateutil.parser.parse(date_str)
    return dt.strftime('%Y-%m-%d')

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
    # csv schema is: 'idx,grant_id,title,abstract,amount,date,cat1_raw,agency'
    fpath = Path(fpath)
    with fpath.open() as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if i == 0:
                # header row
                continue

            # yield [
            #     row[1],  # title
            #     row[2],  # abstract
            #     row[3],  # amount
            #     row[4],  # date
            #     row[6],  # division name
            # ]

            yield {
                'grant_id': row[1],
                'title': row[2],
                'abstract': row[3],
                'amount': row[4],
                'date': row[5],
                'cat1_raw': row[6],
                'agency': row[7],
            }


def get_data(data_source: Iterable, div_map: Optional[Mapping] = None) -> Generator:

    if div_map is None:
        script_dir = os.path.dirname(os.path.realpath(__file__))
        divisions_fpath = os.path.join(script_dir, "../assets/divisions.json")
        with open(divisions_fpath) as div_file:
            divs = json.load(div_file)
            div_map = {d["name"].lower(): d["key"] for d in divs}

    Grant.init()

    for r in tqdm(data_source):
        cat1_raw = r['cat1_raw']
        if not cat1_raw:
            # throw away rows with missing category info
            continue
        mapped_longname = nsf_mapped_reversed.get(cat1_raw, cat1_raw)
        mapped_abbrev = abbrevs_flat.get(normalize(mapped_longname))
        if not mapped_abbrev:
            # TODO: for now, throw away rows without mapped category. revisit this
            continue
        try:
            g = Grant(
                grant_id = r['grant_id'],
                title=r['title'],
                abstract=r['abstract'],
                amount=r['amount'],
                # date=r['date'],
                date=format_date(r['date']),
                cat1_raw=cat1_raw,
                cat1=mapped_abbrev,
                agency=r['agency'],
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
