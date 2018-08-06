from gensim.models.word2vec import Word2Vec
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
import mysql.connector

db = mysql.connector.connect(host="localhost",
        database="nsf",
        user="nsf",
        password="!DLnsf333")

cursor = db.cursor()

cursor.execute("select AwardTitle, AbstractNarration from Award limit 100")

stop = set(stopwords.words('english'))
stop.add(',')
stop.add('.')

result = cursor.fetchall()
proc = []
for r in result:
    proc.append([w.lower() 
        for w in sent_tokenize(r[0].replace("<br/>", "\n")) +\
                 sent_tokenize(r[1].replace("<br/>", "\n")) 
        if w.lower() not in stop])

print(proc)
exit()

model = Word2Vec(proc, size=100, window=5, min_count=5, workers=4)
model.save("nsf_w2v_model_2")
similar = model.wv.most_similar(['data', 'science'], [])
print(similar)

