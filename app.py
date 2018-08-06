from flask import Flask, render_template, request
from gensim.models.word2vec import Word2Vec
import ruamel.yaml as yaml
#import multiprocessing
import logging
import json
import pandas as pd
from functools32 import lru_cache
from flaskext.mysql import MySQL
from collections import defaultdict
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, MultiSearch, Document, Date, Keyword, Text, Index, connections
from elasticsearch_dsl.query import MultiMatch


app = Flask(__name__)
es = Elasticsearch()
mysql = MySQL()

app.config["MYSQL_DATABASE_USER"] = "nsf"
app.config["MYSQL_DATABASE_PASSWORD"] = "!DLnsf333"
app.config["MYSQL_DATABASE_DB"] = "nsf"
app.config["MYSQL_DATABASE_HOST"] = "localhost"
mysql.init_app(app)

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

#@app.route("/rolling_5.csv")
#def rolling_5():
#    with open("rolling_5.csv", "r") as f:
#        return f.read()
#
#@app.route("/rolling_10.csv")
#def rolling_10():
#    with open("rolling_10.csv", "r") as f:
#        return f.read()
#
#@app.route("/rolling_25.csv")
#def rolling_25():
#    with open("rolling_25.csv", "r") as f:
#        return f.read()


@app.route("/index2")
def main():
    return render_template("index.html")

@app.route("/")
def main2():
    return render_template("index2.html")


@app.route("/search2", methods=["POST"])
def search2():
    terms = frozenset(request.get_json())
    return get_filtered(terms)

@app.route("/search", methods=['GET', 'POST'])
def search():

    j = request.get_json()

    if  j == "":
        terms = frozenset(keywords)
        with open("divisions.csv", "r") as f:
            div = frozenset([l.strip() for l in f.readlines()])

    else:
        data = yaml.safe_load(j)
        terms, div = frozenset(data["terms"]), frozenset(data["divisions"])

    #jobs = []
    #pipe = []
    #for i in range(2):
    #    pipe.append(multiprocessing.Pipe(False))

    #jobs.append(multiprocessing.Process(target=plot1, args=(pipe[0][1], terms)))
    #jobs.append(multiprocessing.Process(target=plot2, args=(pipe[1][1], terms, div)))

    #for p in jobs:
    #    p.start()

    #for p in jobs:
    #    p.join()

    #csv = "\n".join([p[0].recv() for p in pipe])
    csv = plot1(terms) + "\n" + plot2(terms, div)

    return csv

word_vecs = Word2Vec.load("nsf_w2v_model").wv

@app.route("/suggestions", methods=['POST'])
def suggestions():
    terms = []
    for t in request.get_json():
        for t1 in t.split():
            if t1 in word_vecs.vocab:
                terms.append(t1)

    if len(terms) > 0:
        related = word_vecs.most_similar(terms, [])
        return ",".join([r[0] for r in related])
    else:
        return ""


@app.route("/grants2", methods=['POST'])
def grants2():

    j = request.get_json()

    if  j == "":
        terms = keywords
        with open("divisions.csv", "r") as f:
            div = [l.strip() for l in f.readlines()]

    else:
        data = yaml.safe_load(j)
        terms = data["terms"]
        div = data["divisions"]
        while len(div) < 2:
            div.append("")

    csv = "title,date,value,division\n" + fast_grants(terms, div)
    return csv

@app.route("/grants", methods=['POST'])
def grants():

    j = request.get_json()

    if  j == "":
        terms = keywords
        with open("divisions.csv", "r") as f:
            div = [l.strip() for l in f.readlines()]

    else:
        data = yaml.safe_load(j)
        terms = data["terms"]
        div = data["divisions"]
        while len(div) < 2:
            div.append("")

    csv = "title,date,value,division\n" + grant_data(terms, div)
    return csv

keywords = [
      'data science',
      'machine learning',
    #  'deep learning',
      'artificial intelligence',
    #  'convolutional neural networks',
    #  'recurrent neural network',
    #  'stochastic gradient descent',
    #  'support vector machines',
    #  'unsupervised learning',
    #  'supervised learning',
    #  'reinforcement learning',
    #  'generative adversarial networks',
    #  'random forest',
    #  'naive bayes',
    #  'bayesian networks',
    ##generic = [
    #  'data science',
    #  'big data',
    #  'data driven',
    #  'data intensive',
    #  'data enabled',
    ##visualization = [
    #  'matplotlib',
    #  'ggplot',
    #  'd3',
    #  'vega',
    #  'vega-lite',
    ##dbms = [
    #  'sql',
    #  'mysql',
    #  'sql server',
    ##infrastructure = [
    #  'matlab',
    #  'jupyter',
    #  'cesium',
    #  'cyverse',
    #  'iplant',
]

@app.route("/defaults")
def get_defaults():
    return json.dumps({
        "keywords": keywords,
        "divisions": [{
            "value": d.strip(),#.lower().strip().replace(" ", "-"), 
            "text": d.strip(),
            "default": True if i < 3 else False
        } for i, d in enumerate(open("divisions.csv", "r").readlines())
    ]})

@lru_cache(maxsize=50)
def get_filtered(terms):

    it = iter(terms)
    
    m = MultiMatch(query=next(it), fields=['title', 'abstract'], type="phrase")
    # take union of all matching queries
    l = len(terms) - 1
    for t in range(l):
        m = m | MultiMatch(query=next(it), fields=['title', 'abstract'], type="phrase")

    s = Search(using=es)

    s.aggs.bucket("per_year", "date_histogram", field="date", interval="year") \
        .bucket("per_division", "terms", field="division", size=80) \
        .metric("agg_grants", "value_count", field="date") \
        .metric("agg_amount", "sum", field="amount")

    total = s.execute().aggregations

    s = Search(using=es).query(m)

    s.aggs.bucket("per_year", "date_histogram", field="date", interval="year") \
        .bucket("per_division", "terms", field="division", size=80) \
        .metric("agg_grants", "value_count", field="date") \
        .metric("agg_amount", "sum", field="amount")

    matched = s.execute().aggregations

    json_data = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))

    for year in total.per_year.buckets:
        y = year.key_as_string[:4]
        for division in year.per_division.buckets:
            json_data[y][division.key]["total_grants"] = division.agg_grants.value
            json_data[y][division.key]["total_amount"] = division.agg_amount.value
            json_data[y][division.key]["match_grants"] = 0
            json_data[y][division.key]["match_amount"] = 0
            json_data[y]["all"]["total_grants"] += division.agg_grants.value
            json_data[y]["all"]["total_amount"] += division.agg_amount.value

    for year in matched.per_year.buckets:
        y = year.key_as_string[:4]
        for division in year.per_division.buckets:
            json_data[y][division.key]["match_grants"] = division.agg_grants.value
            json_data[y][division.key]["match_amount"] = division.agg_amount.value
            json_data[y]["all"]["match_grants"] += division.agg_grants.value
            json_data[y]["all"]["match_amount"] += division.agg_amount.value

    return json.dumps([{"year": year, "data": json_data[str(year)]} for year in range(2007, 2018)])


@lru_cache(maxsize=20)
def plot1(terms):
    db = mysql.get_db()

    query = """SELECT YEAR(AwardEffectiveDate) as year, COUNT(*) as c_total, SUM(AwardAmount) as s_total 
               FROM Award WHERE YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               GROUP BY YEAR(AwardEffectiveDate)"""

    total = pd.read_sql(query, db)

    query = """SELECT YEAR(AwardEffectiveDate) as year, COUNT(*) as c_matching, SUM(AwardAmount) as s_matching 
               FROM Award A WHERE YEAR(AwardEffectiveDate) BETWEEN 2007 and 2017
               AND (MATCH(AwardTitle) AGAINST ('{0}' IN BOOLEAN MODE) 
               OR MATCH(AbstractNarration) AGAINST ('{0}' IN BOOLEAN MODE)) 
               GROUP BY YEAR(AwardEffectiveDate)""".format(" ".join(['"{}"'.format(t) for t in terms]))

    matching = pd.read_sql(query, db)
    return pd.merge(total, matching, on='year', how='outer').to_csv(index=False)

@lru_cache(maxsize=20)
def plot2(terms, divisions):
    db = mysql.get_db()

    if len(divisions) == 0:
        long_name = "AND false"
    elif len(divisions) == 1:
        long_name = "AND LongName == " + divisions[0]
    else:
        long_name = "AND LongName IN " + str(tuple(divisions))

    query = """SELECT YEAR(AwardEffectiveDate) as year, COUNT(*) as c_total, SUM(AwardAmount) as s_total 
               FROM Award A, Division D WHERE A.AwardID = D.AwardID 
               AND YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               {long_name} 
               GROUP BY YEAR(AwardEffectiveDate)""".format(long_name=long_name)
    
    total = pd.read_sql(query, db)

    query = """SELECT YEAR(AwardEffectiveDate) as year, COUNT(*) as c_matching, SUM(AwardAmount) as s_matching 
               FROM Award A, Division D WHERE A.AwardID = D.AwardID 
               AND YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               AND (MATCH(AwardTitle) AGAINST ('{0}' IN BOOLEAN MODE) 
               OR MATCH(AbstractNarration) AGAINST ('{0}' IN BOOLEAN MODE)) 
               {1}
               GROUP BY YEAR(AwardEffectiveDate)""".format(" ".join(['"{}"'.format(t) for t in terms]), long_name)

    try:
        matching = pd.read_sql(query, db)
    except:
        matching = total
    return pd.merge(total, matching, on='year', how='outer').to_csv(index=False)

def fast_grants(terms, divisions):

    it = iter(terms)

    m = MultiMatch(query=next(it), fields=['title', 'abstract'], type="phrase")
    # take union of all matching queries
    l = len(terms) - 1
    for t in range(l):
        m = m | MultiMatch(query=next(it), fields=['title', 'abstract'], type="phrase")

    s = Search(using=es).query(m)

    matched = ["\"{}\",{},{},{}".format(r.title, r.date, r.amount, r.division) for r in s.scan() if r.division in divisions]
    return "\n".join(matched)

#@lru_cache(maxsize=20)
def grant_data(terms, divisions):
    db = mysql.get_db()

    query = """SELECT AwardTitle, AwardEffectiveDate, AwardAmount, LongName
               FROM Award A, Division D WHERE A.AwardID = D.AwardID
               AND YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               AND (MATCH(AwardTitle) AGAINST ('{0}' IN BOOLEAN MODE) 
               OR MATCH(AbstractNarration) AGAINST ('{0}' IN BOOLEAN MODE)) 
               AND LongName in {1}""".format(" ".join(['"{}"'.format(t) for t in terms]), tuple(divisions))
    
    return pd.read_sql(query, db).to_csv(index=False, header=False)

if __name__ == "__main__":
    app.run(host='0.0.0.0')
