from elasticsearch import Elasticsearch, helpers

es = Elasticsearch()

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
        
            input = [*words, *ngrams(words, 2), *ngrams(words, 3), term]
            s = sorted(set(input), key=input.index)
            
            yield {
                'term': term,
                'suggest': {
                    'weight': int(float(weight) * 100),
                    'input': s,
                }
            }
          
      
def build_index():
    n_gram_mapping = {
            'mappings': {
                'properties': {
                    'suggest': {
                        'type': 'completion'
                    },
                    'term': {
                        'type': 'keyword'
                    }
                }
            }
        }

    es.indices.delete('nsf-suggest')
    es.indices.create('nsf-suggest', body=n_gram_mapping)

    helpers.bulk(es, ({
        '_index': 'nsf-suggest',
        '_source': source
    } for source in get_data()))
        
build_index()