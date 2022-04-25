import json
import os
from pathlib import Path
import argparse
from elasticsearch import helpers
from elasticsearch_dsl import (
    Document,
    Keyword,
    Index,
    Completion,
    connections,
)

import logging

root_logger = logging.getLogger()
logger = root_logger.getChild(__name__)


host = os.environ.get('ELASTICSEARCH_HOST', 'localhost')
es = connections.create_connection(hosts=[host], timeout=20)
index_name = os.environ.get("ELASTICSEARCH_SUGGEST_INDEX", "grants-suggest")

suggestions = Index(index_name)
suggestions.settings(
    number_of_shards=8,
    number_of_replicas=2,
)

@suggestions.document
class Suggestion(Document):
    suggest = Completion()
    term = Keyword()
    stem = Keyword()
    forms = Keyword(multi=True)


def ngrams(input, n):
    output = []
    for i in range(len(input)-n+1):
        output.append(input[i:i+n])
    return [' '.join(gram) for gram in output]


def get_data(
    terms_file: str,
    stems_file: str,
    stem_groups_file: str,
):
    terms_file = Path(terms_file).resolve()
    with \
        open(terms_file, 'r') as terms,\
        open(stems_file, 'r') as stems,\
        open(stem_groups_file, 'r') as stem_groups:
            
        stem_groups = json.load(stem_groups)
        stems = json.load(stems)
        seen_stems = set()

        for line in terms:
            try:
                weight, term = line.strip().split()
            except ValueError:
                logger.warning(f"ERROR!! line: {line}")
                continue
            if float(weight) < 0:
                continue
            term = term.replace('_', ' ')
            words = term.split()
        
            stem = stems.get(term.lower(), term)
            forms = [f.replace('_', ' ') for f in stem_groups.get(stem, [])]

            # TODO also include other forms in input here
            input = [term, *words, *ngrams(words, 2), *ngrams(words, 3)]

            for form in forms:
                words = form.split()
                input.extend([form, *words, *ngrams(words, 2), *ngrams(words, 3)])
                
            input = list(set(input))
            
            if stem not in seen_stems:
                seen_stems.add(stem)
                yield Suggestion(
                    term=term,
                    suggest={
                        'weight': int(float(weight) * 100),
                        'input': input,
                    },
                    stem=stem,
                    forms=[form for form in forms if form != term]
                ).to_dict(True)
          
      
def build_index(**args):
    if suggestions.exists():
        suggestions.delete()
    suggestions.create()


    helpers.bulk(es, get_data(**args))

        
if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.realpath(__file__))
    terms_file = os.path.join(script_dir, '../assets/terms.txt')
    stems_file = os.path.join(script_dir, '../assets/stems.json')
    stem_groups_file = os.path.join(script_dir, '../assets/stem_groups.json')
    parser = argparse.ArgumentParser()
    parser.add_argument('terms_file', nargs='?', default=terms_file)
    parser.add_argument('stems_file', nargs='?', default=stems_file)
    parser.add_argument('stem_groups_file', nargs='?', default=stem_groups_file)

    args = parser.parse_args()
    build_index(
        terms_file=args.terms_file,
        stems_file=args.stems_file,
        stem_groups_file=args.stem_groups_file
    )