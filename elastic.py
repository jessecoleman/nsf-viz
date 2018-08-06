from elasticsearch_dsl import Search, MultiSearch, Document, Date, Keyword, Text, Index, connections

from elasticsearch import Elasticsearch
from elasticsearch_dsl.query import MultiMatch, Match
from datetime import datetime
import mysql.connector as conn

client = Elasticsearch()
connections.create_connection(hosts=['localhost'], timeout=20)

db = conn.connect(database="nsf",
        user="nsf",
        password="!DLnsf333",
        host="localhost")

print(db)

nsf = Index('nsf')
nsf.settings(
        number_of_shards=8,
        number_of_replicas=2,
    )

@nsf.document
class Grant(Document):
    title = Text()
    abstract = Text()
    date = Date()
    division = Keyword()

    class Index:
        name = "nsf"

nsf.delete()
nsf.create()

cur = db.cursor()
cur.execute("select AwardTitle, AbstractNarration, AwardAmount, AwardEffectiveDate, LongName from Award join Division on Award.AwardID = Division.AwardID")

Grant.init()

for r in cur.fetchall():
    g = Grant(title=r[0], abstract=r[1], date=r[3], division=r[4])
    g.amount = r[2]
    g.save()

exit()

client = Elasticsearch()

s = Search(using=client)
#        .query("match", title="test")
#
#response = s.execute()
#print(response)

m = MultiMatch(query='data science', fields=['awardtitle', 'abstractnarration'], type="phrase")
#        MultiMatch(query='data science', fields=['awardtitle', 'abstractnarration'], type="phrase")
   
#s = s.query(m) #.execute()

s.aggs.bucket("per_year", "date_histogram", field="awardeffectivedate", interval="year") \
        .metric("amount_per_year", "sum", field="awardamount") \
        .metric("grants_per_year", "value_count", field="awardeffectivedate") \

 
r = s.execute()
years = [(int(b.key_as_string[:4]), b.grants_per_year.value, b.amount_per_year.value) for b in r.aggregations.per_year.buckets]
print(years)

#print(len(result))

#for i, hit in enumerate(result):
#    print(i, hit.awardtitle)

