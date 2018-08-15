from flask import Flask, render_template, request
from gensim.models.word2vec import Word2Vec
import logging
import json
from functools32 import lru_cache
from collections import defaultdict
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, MultiSearch, Document, Date, Keyword, Text, Index, connections
from elasticsearch_dsl.query import MultiMatch


app = Flask(__name__)
es = Elasticsearch()

#app.config["MYSQL_DATABASE_USER"] = "nsf"
#app.config["MYSQL_DATABASE_PASSWORD"] = "!DLnsf333"
#app.config["MYSQL_DATABASE_DB"] = "nsf"
#app.config["MYSQL_DATABASE_HOST"] = "localhost"
#mysql.init_app(app)

#nsf = Index('nsf')
#nsf.settings(
#        number_of_shards=8,
#        number_of_replicas=2,
#    )
#
#@nsf.document
#class Grant(Document):
#    title = Text()
#    abstract = Text()
#    amount = Text()
#    date = Date()
#    division = Keyword()
#
#    class Index:
#        name = "nsf"
#
#Grant.init()

@app.route("/rolling")
def rolling():
    return open("rolling_10.csv", "r").read()


@app.route("/women-philosophy")
def women_phil():
    return render_template("index_women.html")

@app.route("/index2")
def main2():
    return render_template("index2.html")

@app.route("/")
def main():
    return render_template("index.html")


@app.route("/search", methods=["POST"])
def search():
    j = request.get_json()
    toggle, terms = j["toggle"], j["terms"]

    if len(terms) == 0: 
        return json.dumps(
            [{"year": y, "data": 
                {"all": {
                    "total_amount": 0,
                    "total_grants": 0,
                    "match_amount": 0,
                    "match_grants": 0
                }}}
            for y in range(2007, 2018)]
        )

    total = search_elastic(toggle)
    matched = search_elastic(toggle, frozenset(terms))

    json_data = defaultdict(dict)

    for year in total.per_year.buckets:
        y = int(year.key_as_string[:4])
        if y not in list(range(2007, 2018)): continue
        json_data[y]["year"] = int(y)
        json_data[y]["all"] = defaultdict(int)
        for div in year.per_division.buckets:
            json_data[y]["all"]["total_grants"] += div.agg_grants.value
            json_data[y]["all"]["total_amount"] += div.agg_amount.value
            json_data[y][div.key] = {
                    "total_grants": div.agg_grants.value,
                    "total_amount": div.agg_amount.value,
                    "match_grants": 0,
                    "match_amount": 0
            }

    for year in matched.per_year.buckets:
        y = int(year.key_as_string[:4])
        if y not in list(range(2007, 2018)): continue
        for div in year.per_division.buckets:
            json_data[y]["all"]["match_grants"] += div.agg_grants.value
            json_data[y]["all"]["match_amount"] += div.agg_amount.value
            json_data[y][div.key].update({
                "match_grants": div.agg_grants.value,
                "match_amount": div.agg_amount.value
            })

    return json.dumps(json_data) #[{"div": div, "data": json_data[div]} 
        #for div in ])


word_vecs = Word2Vec.load("nsf_w2v_model").wv

@app.route("/suggestions", methods=['POST'])
def suggestions():
    terms = []
    print(request.get_json());
    for t in request.get_json():
        for t1 in t.split():
            if t1 in word_vecs.vocab:
                terms.append(t1)

    if len(terms) > 0:
        related = word_vecs.most_similar(terms, [])
        return ",".join([r[0] for r in related])
    else:
        return ""


@app.route("/grants", methods=['POST'])
def grants():

    j = request.get_json()

    terms = j["terms"]
    div = j["divisions"]
    toggle = j["toggle"]

    csv = "title,date,value,division\n" + grant_data(terms, div, toggle)
    return csv

keywords = [
      'data science',
      'machine learning',
      'artificial intelligence'
      'deep learning',
      'convolutional neural networks',
      'recurrent neural network',
      'stochastic gradient descent',
      'support vector machines',
      'unsupervised learning',
      'supervised learning',
      'reinforcement learning',
      'generative adversarial networks',
      'random forest',
      'naive bayes',
      'bayesian networks',
      'big data'
]

@app.route("/defaults")
def get_defaults():
    return json.dumps({
        "keywords": keywords,
        "divisions": [{
            "name": d.strip()[:-2],
            "default": d.strip()[-1] == "y"
        } for i, d in enumerate(open("static/divisions.csv", "r").readlines())
    ]})


@lru_cache(maxsize=50)
def search_elastic(toggle, terms=None):

    s = Search(using=es)

    if terms is not None:
        it = iter(terms)
    
        m = MultiMatch(query=next(it), fields=['title', 'abstract'], type="phrase")
        # take union of all matching queries
        l = len(terms) - 1
        for t in range(l):
            if toggle:
                m = m & MultiMatch(query=next(it), fields=['title', 'abstract'], type="phrase")
            else:
                m = m | MultiMatch(query=next(it), fields=['title', 'abstract'], type="phrase")

        s = s.query(m)

    s.aggs.bucket("per_year", "date_histogram", field="date", interval="year") \
        .bucket("per_division", "terms", field="division", size=80) \
        .metric("agg_grants", "value_count", field="date") \
        .metric("agg_amount", "sum", field="amount")

    return s.execute().aggregations


def grant_data(terms, divisions, toggle):

    it = iter(terms)

    m = MultiMatch(query=next(it), fields=['title', 'abstract'], type="phrase")
    # take union of all matching queries
    for t in range(len(terms) - 1):
        if toggle:
            m = m & MultiMatch(query=next(it), fields=['title', 'abstract'], type="phrase")
        else:
            m = m | MultiMatch(query=next(it), fields=['title', 'abstract'], type="phrase")

    s = Search(using=es).query(m)

    matched = ["\"{}\",{},{},{}".format(r.title, r.date, r.amount, r.division) 
            for r in s.scan() if r.division in divisions]

    return "\n".join(matched)


if __name__ == "__main__":
    app.run(host='0.0.0.0')
