import os
from elasticsearch import Elasticsearch, bulk
from mysql.connector import conn


def index(grant):

    doc = {
      '_source': grant,
      '_id': grant.id,
      '_type': '_doc',
      '_index': 'nsf'
    }
    
    
if __name__ == '__main__':

    db = conn.connect(database="nsf",
            user="nsf",
            password="!DLnsf333",
            host="localhost")

    host = os.environ.get('ELASTICSEARCH_HOST', 'localhost')
    es = Elasticsearch([{'host': host}])

    bulk(es, [index(grant) for grant in grants])