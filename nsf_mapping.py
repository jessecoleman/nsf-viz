from elasticsearch import Elasticsearch, helpers
import sys
import json

es = Elasticsearch()

def build_index():
    n_gram_mapping = {
            "mappings": {
                "grams": {
                    "properties": {
                        "suggest": {
                            "type": "completion"
                        },
                        "gram": {
                            "type": "keyword"
                        }
                    }
                }
            }
        }
    
    es.indices.delete('nsf-suggest')
    es.indices.create('nsf-suggest', body=n_gram_mapping)
    
    with open("filtered_grams.txt", "r") as f:
        helpers.bulk(es, ({
            "_index": "nsf-suggest",
            "_type": "grams",
            "_source": {
                "gram": g[0].strip(),
                "suggest": {
                    "input": g[0].strip().split(),
                    "weight": int(g[1])
                }
            }
        } for g in (r.strip().rsplit(',', 1) for r in f)))

result = es.search(index="nsf-suggest", body={
        "suggest": {
            "gram-suggest": {
                "prefix": sys.argv[1:],
                "completion": {
                    "field": "suggest"
                }
            }
        }
    })

print(json.dumps(result, indent=2))
