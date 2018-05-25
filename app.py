from flask import Flask, render_template, request
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
        div = divisions

    else:
        data = yaml.safe_load(j)
        terms = data["terms"]
        div = data["divisions"]

    csv = "year,matching,total\n" + "\n".join([
        plot1(terms),
        plot2(terms, div),
        plot3(terms),
        plot4(terms, div)
    ])

    return csv

@app.route("/grants", methods=['POST'])
def grants():

    j = request.get_json()

    if  j == "":
        terms = keywords
        div = divisions

    else:
        data = yaml.safe_load(j)
        terms = data["terms"]
        div = data["divisions"]

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

# list of possible names in db
divisions = [
    "Division Of Mathematical Sciences",
    "Division Of Computer and Network Systems",
    "Div Of Industrial Innovation & Partnersh",
    "Div Of Civil, Mechanical, & Manufact Inn",
    "Div Of Chem, Bioeng, Env, & Transp Sys",
    "Division Of Earth Sciences",
    "Division Of Undergraduate Education",
    "Division Of Behavioral and Cognitive Sci",
    "Div Of Information & Intelligent Systems",
    "Division Of Chemistry",
    "Division Of Materials Research",
    "Divn Of Social and Economic Sciences",
    "Division of Computing and Communication Foundations",
    "Division Of Ocean Sciences",
    "Division Of Environmental Biology"
]

@app.route("/keywords")
def get_keywords():
    return json.dumps([{"tag": kw} for kw in keywords])

@app.route("/divisions")
def get_divisions():
        return json.dumps([{"tag": d.strip()} for d in open("divisions.csv", "r").readlines()])

@app.route("/c1")
def plot1(terms):
    cur = mysql.get_db().cursor()

    query = """SELECT YEAR(AwardEffectiveDate), COUNT(*) FROM Award 
               WHERE YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               GROUP BY YEAR(AwardEffectiveDate)"""

    cur.execute(query)
    total = [r[1] for r in cur.fetchall()]

    query = """SELECT YEAR(AwardEffectiveDate), COUNT(*) FROM Award A
               WHERE YEAR(AwardEffectiveDate) BETWEEN 2007 and 2017
               AND (MATCH(AwardTitle) AGAINST ('{0}' IN BOOLEAN MODE) 
               OR MATCH(AbstractNarration) AGAINST ('{0}' IN BOOLEAN MODE)) 
               GROUP BY YEAR(AwardEffectiveDate)""".format(" ".join(['"{}"'.format(t) for t in terms]))

    cur.execute(query)
    matching = [r[1] for r in cur.fetchall()]

    return "\n".join(["{},{},{}".format(x, y0, y1) for x, y0, y1 in  zip(range(2007, 2018), matching, total)])

@app.route("/c2")
def plot2(terms, divisions):
    cur = mysql.get_db().cursor()

    query = """SELECT YEAR(AwardEffectiveDate), COUNT(*)
               FROM Award A, Division D WHERE A.AwardID = D.AwardID 
               AND YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               AND LongName in {0} 
               GROUP BY YEAR(AwardEffectiveDate)""".format(tuple(divisions))

    cur.execute(query)
    total = [r[1] for r in cur.fetchall()]

    query = """SELECT YEAR(AwardEffectiveDate), COUNT(*)
               FROM Award A, Division D WHERE A.AwardID = D.AwardID 
               AND YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               AND (MATCH(AwardTitle) AGAINST ('{0}' IN BOOLEAN MODE) 
               OR MATCH(AbstractNarration) AGAINST ('{0}' IN BOOLEAN MODE)) 
               AND LongName in {1}
               GROUP BY YEAR(AwardEffectiveDate)""".format(" ".join(['"{}"'.format(t) for t in terms]), tuple(divisions))

    cur.execute(query)
    matching = [r[1] for r in cur.fetchall()]
    
    return "\n".join(["{},{},{}".format(x, y0, y1) for x, y0, y1 in  zip(range(2007, 2018), matching, total)])

@app.route("/c3")
def plot3(terms):
    cur = mysql.get_db().cursor()
    sum_all = defaultdict(int)
    query = """SELECT YEAR(AwardEffectiveDate), SUM(AwardAmount)
               FROM Award WHERE YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               GROUP BY YEAR(AwardEffectiveDate) ORDER BY YEAR(AwardEffectiveDate)"""

    cur.execute(query)
    total = [r[1] for r in cur.fetchall()]

    query = """SELECT YEAR(AwardEffectiveDate), SUM(AwardAmount) FROM Award A 
               WHERE YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               AND (MATCH(AwardTitle) AGAINST ('{0}' IN BOOLEAN MODE) 
               OR MATCH(AbstractNarration) AGAINST ('{0}' IN BOOLEAN MODE)) 
               GROUP BY YEAR(AwardEffectiveDate) 
               ORDER BY YEAR(AwardEffectiveDate)""".format(" ".join(['"{}"'.format(t) for t in terms]))

    cur.execute(query)
    matching = [r[1] for r in cur.fetchall()]
    
    return "\n".join(["{},{},{}".format(x, y0, y1) for x, y0, y1 in  zip(range(2007, 2018), matching, total)])

@app.route("/c4")
def plot4(terms, divisions):
    cur = mysql.get_db().cursor()

    query = """SELECT YEAR(AwardEffectiveDate), SUM(AwardAmount)
               FROM Award A, Division D WHERE A.AwardID = D.AwardID 
               AND YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               AND LongName in {0} 
               GROUP BY YEAR(AwardEffectiveDate)""".format(tuple(divisions))

    cur.execute(query)
    total = [r[1] for r in cur.fetchall()]

    query = """SELECT YEAR(AwardEffectiveDate), SUM(AwardAmount)
               FROM Award A, Division D WHERE A.AwardID = D.AwardID 
               AND YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               AND (MATCH(AwardTitle) AGAINST ('{0}' IN BOOLEAN MODE) 
               OR MATCH(AbstractNarration) AGAINST ('{0}' IN BOOLEAN MODE)) 
               AND LongName in {1} 
               GROUP BY YEAR(AwardEffectiveDate)""".format(" ".join(['"{}"'.format(t) for t in terms]), tuple(divisions))

    cur.execute(query)
    matching = [r[1] for r in cur.fetchall()]

    return "\n".join(["{},{},{}".format(x, y0, y1) for x, y0, y1 in  zip(range(2007, 2018), matching, total)])

def grant_data(terms, divisions):
    cur = mysql.get_db().cursor()

    query = """SELECT AwardTitle, AwardEffectiveDate, AwardAmount, LongName
               FROM Award A, Division D WHERE A.AwardID = D.AwardID
               AND YEAR(AwardEffectiveDate) BETWEEN 2007 AND 2017 
               AND (MATCH(AwardTitle) AGAINST ('{0}' IN BOOLEAN MODE) 
               OR MATCH(AbstractNarration) AGAINST ('{0}' IN BOOLEAN MODE)) 
               AND LongName in {1}""".format(" ".join(['"{}"'.format(t) for t in terms]), tuple(divisions))
    
    cur.execute(query)
    def format_row(row):
        row = [str(val) for val in row]
        row[0] = '"{}"'.format(row[0].replace('"', '""'))
        return row

    return "\n".join([",".join(format_row(row)) for row in cur.fetchall()])

if __name__ == "__main__":
    app.run(host='0.0.0.0')
