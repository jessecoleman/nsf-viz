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

host = os.environ.get('ELASTICSEARCH_HOST', 'localhost')
es = connections.create_connection(hosts=[host], timeout=20)

suggestions = Index('nsf-suggest')
suggestions.settings(
    number_of_shards=8,
    number_of_replicas=2,
)

@suggestions.document
class Suggestion(Document):
    suggest = Completion()
    term = Keyword()


def ngrams(input, n):
    output = []
    for i in range(len(input)-n+1):
        output.append(input[i:i+n])
    return [' '.join(gram) for gram in output]


def get_data(terms_file='../assets/terms.txt'):
    terms_file = Path(terms_file).resolve()
    with open(terms_file, 'r') as terms:
        for line in terms:
            weight, term = line.strip().split()
            term = term.replace('_', ' ')
            words = term.split()
        
            input = [*words, *ngrams(words, 2), *ngrams(words, 3)]
            if term not in input:
                input.append(term)
            
            yield Suggestion(
                term=term,
                suggest={
                    'weight': int(float(weight) * 100),
                    'input': input,
                }
            ).to_dict(True)
          
      
def build_index(terms_file='../assets/terms.txt'):
    if suggestions.exists():
        suggestions.delete()
    suggestions.create()


    helpers.bulk(es, get_data(terms_file=terms_file))

        
if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.realpath(__file__))
    terms_file = os.path.join(script_dir, '../assets/terms.txt')
    parser = argparse.ArgumentParser()
    parser.add_argument('terms_file', nargs='?', default=terms_file)

    args = parser.parse_args()
    build_index(terms_file=args.terms_file)