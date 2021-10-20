# -*- coding: utf-8 -*-

DESCRIPTION = (
    """Ingest data into elasticsearch from a CSV, and train the similarity model"""
)

import sys, os, time
from pathlib import Path
from datetime import datetime
from timeit import default_timer as timer

try:
    from humanfriendly import format_timespan
except ImportError:

    def format_timespan(seconds):
        return "{:.2f} seconds".format(seconds)


import logging

root_logger = logging.getLogger()
logger = root_logger.getChild(__name__)

from index_grants import build_index, data_source_csv
from build_model import (
    build_gram_model,
    count_phrases,
    get_data,
    data_source_elasticsearch,
    train_model,
)
from index_suggester import build_index as build_index_suggester


def pipeline(csvfname, outdir):
    outdir = Path(outdir)
    assert outdir.exists()
    intermediate_file = outdir.joinpath("intermediate.txt")
    data_file = outdir.joinpath("data.txt")
    model_file = outdir.joinpath("nsf_w2v_model")
    terms_file = outdir.joinpath("terms.txt")

    logger.info(f"Building elasticsearch index from csv file: {csvfname}")
    data_source = data_source_csv(csvfname)
    build_index(data_source=data_source)

    logger.info(f"getting data for model and saving to {intermediate_file}")
    data_source = data_source_elasticsearch()
    get_data(intermediate_file, data_source=data_source)
    logger.info(f"building gram model and saving to {data_file}")
    build_gram_model(intermediate_file, data_file)
    logger.info(f"training model (saving to {model_file})")
    train_model(data_file, model_file=model_file)
    logger.info(f"getting counts and saving to: {terms_file}")
    count_phrases(data_file, model_file=model_file, terms_file=terms_file)

    logger.info(f"Building elasticsearch suggest index from terms file ({terms_file})")
    build_index_suggester(terms_file=terms_file)


def main(args):
    pipeline(args.input, args.assets_dir)


if __name__ == "__main__":
    total_start = timer()
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s %(name)s.%(lineno)d %(levelname)s : %(message)s",
            datefmt="%H:%M:%S",
        )
    )
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)
    logger.info(" ".join(sys.argv))
    logger.info("{:%Y-%m-%d %H:%M:%S}".format(datetime.now()))
    logger.info("pid: {}".format(os.getpid()))
    import argparse

    parser = argparse.ArgumentParser(description=DESCRIPTION)
    parser.add_argument("input", help="input CSV file")
    parser.add_argument("assets_dir", help="output directory for assets")
    parser.add_argument("--debug", action="store_true", help="output debugging info")
    global args
    args = parser.parse_args()
    if args.debug:
        root_logger.setLevel(logging.DEBUG)
        root_logger.getChild('urllib').setLevel(logging.INFO)
        root_logger.getChild('elasticsearch').setLevel(logging.INFO)
        logger.debug("debug mode is on")
    else:
        # root_logger.getChild('urllib').setLevel(logging.WARNING)
        root_logger.getChild('elasticsearch').setLevel(logging.WARNING)

    main(args)
    total_end = timer()
    logger.info(
        "all finished. total time: {}".format(format_timespan(total_end - total_start))
    )
