import os
import json
import csv
import dateutil.parser
from pathlib import Path
from typing import Generator, Iterable, List, Mapping, Optional, Type, Union
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

import logging

root_logger = logging.getLogger()
logger = root_logger.getChild(__name__)

from parse_abbrevs import abbrevs_flat, normalize, nsf_mapped_reversed, nsf_directory_inv

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
    grant_id = Keyword()
    agency = Keyword()
    title = Text(fields={"raw": Keyword()}, analyzer=aggressive_analyzer)
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
    external_url = Keyword()


def format_date(date_str: str) -> str:
    dt = dateutil.parser.parse(date_str)
    return dt.strftime("%Y-%m-%d")


def data_source_csv(fpath: Union[str, Path]) -> Generator:
    # csv schema is: 'idx,grant_id,title,abstract,amount,date,cat1_raw,agency'
    fpath = Path(fpath)
    with fpath.open() as f:
        yield from csv.DictReader(f)


def get_data(data_source: Iterable) -> Generator:

    for i, r in enumerate(tqdm(data_source)):
        cat1_raw = r["cat1_raw"]
        if not cat1_raw:
            # throw away rows with missing category info
            logger.debug(f"no 'cat1_raw' found for line {i}. skipping...")
            continue

        # validate amount field
        try:
            amount = int(float(r["amount"]))
        except (ValueError, TypeError):
            # throw away invalid rows
            logger.debug(
                f"for line {i}, 'amount' value is {r['amount']}, which is not valid. skipping..."
            )
            continue

        mapped_longname = nsf_mapped_reversed.get(cat1_raw, cat1_raw)
        mapped_abbrev = abbrevs_flat.get(normalize(mapped_longname))
        if not mapped_abbrev:
            # TODO: for now, throw away rows without mapped category. revisit this
            logger.debug(
                f"no cat1 found for line {i}. 'cat1_raw' is {cat1_raw}. skipping..."
            )
            continue
        try:
            g = Grant(
                grant_id=r["grant_id"],
                title=r["title"],
                abstract=r["abstract"],
                amount=amount,
                # date=r['date'],
                date=format_date(r["date"]),
                cat1_raw=cat1_raw,
                cat1=mapped_abbrev,
                cat2=nsf_directory_inv.get(mapped_abbrev, mapped_abbrev),
                agency=r["agency"],
                external_url=r.get("external_url")
            )
            yield g.to_dict(True)
        except KeyError:
            logger.debug(f"KeyError encountered for line {i}. skipping...")
            continue


def build_index(data_source: Iterable):

    if es_index.exists():
        es_index.delete()

    es_index.create()
    Grant.init()

    bulk(es, get_data(data_source=data_source))


def main(args):
    if args.data_source.endswith(".csv"):
        data_source = data_source_csv(args.data_source)
        build_index(data_source=data_source)
    else:
        raise ValueError('invalid value for argument "data-source"')


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--data-source",
        help="Source for data",
    )
    global args
    args = parser.parse_args()
    main(args)
