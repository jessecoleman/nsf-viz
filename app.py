from flask import Flask, render_template, request, abort
from gensim.models.word2vec import Word2Vec
import logging
import json
from functools import lru_cache
from collections import defaultdict
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, MultiSearch, Document, Date, Keyword, Text, Index, connections
from elasticsearch_dsl.query import MultiMatch

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
es = Elasticsearch()


default_terms = [
      'data science',
      'machine learning',
      'artificial intelligence',
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

@app.route("/")
@app.route("/<toggle>/<terms>")
def main(toggle="any", terms=default_terms):

    if toggle not in ("any", "all"):
        abort

    if type(terms) is str:
        terms = terms.split(",")

    with open("static/divisions.csv", "r") as divs:
        divisions = [{
                "name": d.strip()[:-2],
                "default": d.strip()[-1] == "y"
            } for i, d in enumerate(divs.readlines())]

    return render_template("index.html", toggle=toggle, divisions=divisions, terms=terms)


@app.route("/search/<toggle>/<terms>")
def search(toggle, terms):

    toggle = (toggle == "all")

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
    matched = search_elastic(toggle, terms)
    order = search_elastic(toggle, terms, sort=True)

    sort = {i: b.key for i, b in enumerate(order.per_division.buckets)}
    inv_sort = {b.key: i for i, b in enumerate(order.per_division.buckets)}

    json_data = defaultdict(dict)
    json_data["total_grants"] = {b.key: b.agg_grants.value for b in order.per_division.buckets}
    json_data["total_amount"] = {b.key: b.agg_amount.value for b in order.per_division.buckets}

    for year in total.per_year.buckets:
        y = int(year.key_as_string[:4])
        if y not in list(range(2007, 2018)): continue
        json_data[y]["year"] = y
        json_data[y]["all"] = {
            "index": 5,
            "match_grants": 0,
            "match_amount": 0,
            "total_grants": 0,
            "total_amount": 0
        }
        for div in year.per_division.buckets:
            json_data[y]["all"]["total_grants"] += div.agg_grants.value
            json_data[y]["all"]["total_amount"] += div.agg_amount.value
            json_data[y][div.key] = {
                    "year": y,
                    "index": -1,
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
                "index": inv_sort[div.key],
                "match_grants": div.agg_grants.value,
                "match_amount": div.agg_amount.value
            })

    return json.dumps(json_data)


word_vecs = Word2Vec.load("nsf_w2v_model").wv


@app.route("/typeahead-keywords/<prefix>", methods=['GET'])
def typeahead(prefix):
    result = es.search(index="nsf-suggest", body={
            "suggest": {
                "gram-suggest": {
                    "prefix": prefix,
                    "completion": {
                        "field": "suggest",
                        "size": 15
                    }
                }
            }
        })

    return ",".join([g["_source"]["gram"] for g in result["suggest"]["gram-suggest"][0]["options"]])


@app.route("/related-keywords/<keywords>", methods=['GET'])
def related(keywords):
    terms = []
    for t in keywords.split(","):
        for t1 in t.split():
            if t1 in word_vecs.vocab:
                terms.append(t1)

    if len(terms) > 0:
        related = word_vecs.most_similar(terms, [])
        print(related)
        return ",".join([r[0] for r in related])
    else:
        return ""


query = lambda term: MultiMatch(query=term, fields=['title', 'abstract'], type="phrase")

@lru_cache(maxsize=50)
def search_elastic(toggle, terms=None, sort=False):

    s = Search(using=es)

    if terms is not None:
        terms = terms.split(",")

        q = MultiMatch(query=terms.pop(0), fields=['title', 'abstract'], type='phrase')
        # take union of all matching queries
        for term in terms:
            if toggle:
                q = q & MultiMatch(query=term, fields=['title', 'abstract'], type='phrase')
            else:
                q = q | MultiMatch(query=term, fields=['title', 'abstract'], type='phrase')

        s = s.query(q)

    if sort:
        s.aggs.bucket("per_division", "terms", field="division", order={"agg_grants": "desc"}, size=80) \
            .metric("agg_grants", "value_count", field="date") \
            .metric("agg_amount", "sum", field="amount")

    else:
        s.aggs.bucket("per_year", "date_histogram", field="date", interval="year") \
            .bucket("per_division", "terms", field="division", size=80) \
            .metric("agg_grants", "value_count", field="date") \
            .metric("agg_amount", "sum", field="amount")

    return s.execute().aggregations


@app.route("/grants", methods=['POST'])
def grant_data():

    j = request.get_json()
    terms, divisions, toggle = j["terms"], j["divisions"], j["toggle"]

    q = MultiMatch(query=terms.pop(0), fields=['title', 'abstract'], type="phrase")
    # take union of all matching queries
    for term in j["terms"]:
        if j["toggle"]:
            q = q & MultiMatch(query=term, fields=['title', 'abstract'], type="phrase")
        else:
            q = q | MultiMatch(query=term, fields=['title', 'abstract'], type="phrase")

    s = Search(using=es).query(q)

    return "title,date,value,division,id\n" + "\n".join([
            ",".join([
                    '"{}"'.format(r.title.replace('"', '""')),
                    str(r.date),
                    str(r.amount),
                    r.division,
                    r.meta.id
                ]) for r in s.scan() if r.division in j["divisions"]
        ])

@app.route("/abstract/<_id>/<terms>", methods=["GET"])
def get_abstract(_id, terms):
    query = {
            "query": {
                "terms": {
                    "_id": [_id]
                }
            },
            "highlight": {
                "number_of_fragments": 0,
                "tags_schema": "styled",
                "fields": {
                    "abstract": {
                        "highlight_query": {
                            "bool": {
                                "should": [
                                    {
                                        "match_phrase": {
                                            "abstract": {
                                                "query": term
                                            }
                                        }
                                    }
                                for term in terms.split(",")]
                            }
                        }
                    }
                }
            }
        }

    response = es.search(index="nsf", body=query)
    return response["hits"]["hits"][0]["highlight"]["abstract"][0]


if __name__ == "__main__":
    app.run(host='127.0.0.1')
