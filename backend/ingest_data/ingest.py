# -*- coding: utf-8 -*-

DESCRIPTION = (
    """Ingest data into elasticsearch from a CSV, and train the similarity model"""
)

import sys, os
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

import build_model as bm
from index_grants import build_index, data_source_csv
from index_suggester import build_index as build_index_suggester


def pipeline(csvfname, outdir='.', no_model=False):
    if no_model is False:
        outdir = Path(outdir)
        assert outdir.exists()

    logger.info(f"Building elasticsearch index from csv file: {csvfname}")
    data_source = data_source_csv(csvfname)
    build_index(data_source=data_source)

    if no_model is True:
        logger.info("skipping model training")
    else:
        preprocessed_file = outdir.joinpath("preprocessed.txt")
        ngram_file = outdir.joinpath("ngrams.txt")
        preprocessed_ngrams_file = outdir.joinpath("preprocessed_ngrams.txt")
        stems_file = outdir.joinpath("stems.json")
        stem_groups_file = outdir.joinpath("stem_groups.json")
        model_file = outdir.joinpath("nsf_w2v_model")
        bigrams_model_file = outdir.joinpath("bigrams.bin")
        trigrams_model_file = outdir.joinpath("trigrams.bin")
        terms_file = outdir.joinpath("terms.txt")
        topics_file = outdir.joinpath("topics.json")

        logger.info(f"getting data for model and saving to {preprocessed_file}")
        data_source = bm.data_source_elasticsearch()
        bm.get_data(
            output_file=preprocessed_file,
            data_source=data_source,
            process='ngram',
        )

        logger.info(f"building n-gram models and saving to {bigrams_model_file}, {trigrams_model_file}")
        bm.build_ngram_model(
            input_file=preprocessed_file,
            bigrams_model_file=bigrams_model_file,
            trigrams_model_file=trigrams_model_file,
        )

        logger.info(f"generating n-gram data and saving to {ngram_file}")
        bm.generate_ngrams(
            input_file=preprocessed_file,
            bigrams_model_file=bigrams_model_file,
            trigrams_model_file=trigrams_model_file,
            stems_file=stems_file,
            stem_groups_file=stem_groups_file,
            ngram_file=ngram_file,
        )

        # run ngram output through preprocessor again, this time with 'w2v' process
        data_source = bm.data_source_ngrams(ngram_file)
        bm.get_data(
            output_file=preprocessed_ngrams_file,
            data_source=data_source,
            process='w2v'
        )

        logger.info(f"training model (saving to {model_file})")
        bm.train_w2v_model(
            data_file=ngram_file,
            model_file=model_file
        )

        #logger.info(f"training LDA model (saving to {model_file})")
        #bm.train_lda_model(
        #    input_file=preprocessed_ngrams_file,
        #    model_file='../assets/lda.bin'
        #)

        bm.cluster_vectors(
            input_file=preprocessed_ngrams_file,
            model_file=model_file,
            stem_groups_file=stem_groups_file,
            output_file=topics_file,
        )

        logger.info(f"getting counts and saving to: {terms_file}")
        bm.get_phrase_weights(
            data_file=ngram_file,
            model_file=model_file,
            terms_file=terms_file,
            plot=True
        )

        logger.info(f"Building elasticsearch suggest index from terms file ({terms_file})")
        build_index_suggester(
            terms_file=terms_file,
            stems_file=stems_file,
            stem_groups_file=stem_groups_file,
        )


def main(args):
    pipeline(args.input, args.assets_dir, args.no_model)


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
    parser.add_argument("--no-model", action="store_true", help="only ingest data, do not train model")
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
