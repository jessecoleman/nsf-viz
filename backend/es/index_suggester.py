import os
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


def get_data():
    with open('../assets/terms.txt', 'r') as terms:
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
          
      
def build_index():
    if suggestions.exists():
        suggestions.delete()
    suggestions.create()


    helpers.bulk(es, get_data())

        
if __name__ == '__main__':
    build_index()