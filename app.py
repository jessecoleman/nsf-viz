from flask import Flask, render_template, request
from gensim.models.word2vec import Word2Vec
import logging
import json
import ruamel.yaml as yaml
import pandas as pd
from flaskext.mysql import MySQL
from collections import defaultdict

app = Flask(__name__)
mysql = MySQL()

app.config["MYSQL_DATABASE_USER"] = "nsf"
app.config["MYSQL_DATABASE_PASSWORD"] = "!DLnsf333"
app.config["MYSQL_DATABASE_DB"] = "nsf"
app.config["MYSQL_DATABASE_HOST"] = "localhost"
mysql.init_app(app)


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


@app.route("/")
def main():
    return render_template("index.html")

@app.route("/search", methods=['GET', 'POST'])
def search():

    j = request.get_json()

    if  j == "":
        terms = keywords
        with open("divisions.csv", "r") as f:
            div = [l.strip() for l in f.readlines()]

    else:
        data = yaml.safe_load(j)
        terms, div = data["terms"], data["divisions"]
        while len(div) < 2:
            div.append("")

    csv = "\n".join([
        plot1(terms),
        plot2(terms, div),
        plot3(terms),
        plot4(terms, div)
    ])

    return csv

word_vecs = Word2Vec.load("nsf_w2v_model").wv

@app.route("/suggestions", methods=['POST'])
def suggestions():
    #print(request.get_json())
    terms = []
    for t in request.get_json():
        for t1 in t.split():
            if t1 in word_vecs.vocab:
                terms.append(t1)

    print(terms)
    related = word_vecs.most_similar(terms, [])
    print(related)
    return ",".join([r[0] for r in related])


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

@app.route("/keywords")
def get_keywords():
    return json.dumps(keywords)

@app.route("/divisions")
def get_divisions():
    return json.dumps([{
            "value": d.strip(),#.lower().strip().replace(" ", "-"), 
            "text": d.strip()
        } for d in open("divisions.csv", "r").readlines()
    ])

@app.route("/c1")
def plot1(terms):
    db = mysql.get_db()

    query = """SELECT YEAR(AwardEffectiveDate) as year, COUNT(*) as total 
               FROM Award WHERE YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               GROUP BY YEAR(AwardEffectiveDate)"""

    total = pd.read_sql(query, db)

    query = """SELECT YEAR(AwardEffectiveDate) as year, COUNT(*) as matching 
               FROM Award A WHERE YEAR(AwardEffectiveDate) BETWEEN 2007 and 2017
               AND (MATCH(AwardTitle) AGAINST ('{0}' IN BOOLEAN MODE) 
               OR MATCH(AbstractNarration) AGAINST ('{0}' IN BOOLEAN MODE)) 
               GROUP BY YEAR(AwardEffectiveDate)""".format(" ".join(['"{}"'.format(t) for t in terms]))

    matching = pd.read_sql(query, db)
    return pd.merge(total, matching, on='year', how='outer').to_csv(index=False)

@app.route("/c2")
def plot2(terms, divisions):
    db = mysql.get_db()

    query = """SELECT YEAR(AwardEffectiveDate) as year, COUNT(*) as total
               FROM Award A, Division D WHERE A.AwardID = D.AwardID 
               AND YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               AND LongName in {0} 
               GROUP BY YEAR(AwardEffectiveDate)""".format(tuple(divisions))
    
    total = pd.read_sql(query, db)

    query = """SELECT YEAR(AwardEffectiveDate) as year, COUNT(*) as matching
               FROM Award A, Division D WHERE A.AwardID = D.AwardID 
               AND YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               AND (MATCH(AwardTitle) AGAINST ('{0}' IN BOOLEAN MODE) 
               OR MATCH(AbstractNarration) AGAINST ('{0}' IN BOOLEAN MODE)) 
               AND LongName in {1}
               GROUP BY YEAR(AwardEffectiveDate)""".format(" ".join(['"{}"'.format(t) for t in terms]), tuple(divisions))

    print(query)
    matching = pd.read_sql(query, db)
    print(matching)
    return pd.merge(total, matching, on='year', how='outer').to_csv(index=False)

@app.route("/c3")
def plot3(terms):
    db = mysql.get_db()

    query = """SELECT YEAR(AwardEffectiveDate) as year, SUM(AwardAmount) as total
               FROM Award WHERE YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               GROUP BY YEAR(AwardEffectiveDate) ORDER BY YEAR(AwardEffectiveDate)"""

    total = pd.read_sql(query, db)

    query = """SELECT YEAR(AwardEffectiveDate) as year, SUM(AwardAmount) as matching
               FROM Award A WHERE YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               AND (MATCH(AwardTitle) AGAINST ('{0}' IN BOOLEAN MODE) 
               OR MATCH(AbstractNarration) AGAINST ('{0}' IN BOOLEAN MODE)) 
               GROUP BY YEAR(AwardEffectiveDate) 
               ORDER BY YEAR(AwardEffectiveDate)""".format(" ".join(['"{}"'.format(t) for t in terms]))

    matching = pd.read_sql(query, db)
    return pd.merge(total, matching, on='year', how='outer').to_csv(index=False)

@app.route("/c4")
def plot4(terms, divisions):
    db = mysql.get_db()

    query = """SELECT YEAR(AwardEffectiveDate) as year, SUM(AwardAmount) as total
               FROM Award A, Division D WHERE A.AwardID = D.AwardID 
               AND YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               AND LongName in {0} 
               GROUP BY YEAR(AwardEffectiveDate)""".format(tuple(divisions))

    total = pd.read_sql(query, db)

    query = """SELECT YEAR(AwardEffectiveDate) as year, SUM(AwardAmount) as matching
               FROM Award A, Division D WHERE A.AwardID = D.AwardID 
               AND YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               AND (MATCH(AwardTitle) AGAINST ('{0}' IN BOOLEAN MODE) 
               OR MATCH(AbstractNarration) AGAINST ('{0}' IN BOOLEAN MODE)) 
               AND LongName in {1} 
               GROUP BY YEAR(AwardEffectiveDate)""".format(" ".join(['"{}"'.format(t) for t in terms]), tuple(divisions))

    print(query)
    matching = pd.read_sql(query, db)
    print(matching)
    return pd.merge(total, matching, on='year', how='outer').to_csv(index=False)

def grant_data(terms, divisions):
    db = mysql.get_db()

    query = """SELECT AwardTitle, AwardEffectiveDate, AwardAmount, LongName
               FROM Award A, Division D WHERE A.AwardID = D.AwardID
               AND YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               AND (MATCH(AwardTitle) AGAINST ('{0}' IN BOOLEAN MODE) 
               OR MATCH(AbstractNarration) AGAINST ('{0}' IN BOOLEAN MODE)) 
               AND LongName in {1}""".format(" ".join(['"{}"'.format(t) for t in terms]), tuple(divisions))
    
    return pd.read_sql(query, db).to_csv(index=False, header=False)

#    cur.execute(query)
#    def format_row(row):
#        row = [str(val) for val in row]
#        row[0] = '"{}"'.format(row[0].replace('"', '""'))
#        return row
#
#    return "\n".join([",".join(format_row(row)) for row in cur.fetchall()])

if __name__ == "__main__":
    app.run(host='0.0.0.0')
