from gensim.models.phrases import Phrases, Phraser
from tqdm import tqdm
import json
import spacy
import mysql.connector
from collections import Counter

nlp = spacy.load('en')

db = mysql.connector.connect(
        host="localhost",
        user="nsf",
        passwd="!DLnsf333",
        database="nsf"
    )

cursor = db.cursor()

def raw_grams():
    sentences = []
    
    cursor.execute("SELECT AwardTitle, AbstractNarration from Award")
    for rec in tqdm(cursor.fetchall()):
        sentences.append([t.lower_ for t in nlp(" ".join(rec).replace("<br/>", "")) if not t.is_punct])
    
    bi_phrases = Phrases(sentences, min_count=50, threshold=1)
    bigram = Phraser(bi_phrases)
    
    tri_phrases = Phrases(bigram[sentences], min_count=50, threshold=1)
    trigram = Phraser(tri_phrases)
    
    c = Counter(w for sent in trigram[bigram[sentences]] for w in sent if "_" in w)
    
    print(c.most_common())
    with open("n_grams.txt", "w") as ngrams:
        ngrams.write(json.dumps(c.most_common()))
    

def filter_grams():
    with open("n_grams.txt", "r") as f, open("filtered_grams.txt", "w") as f2:
        n_grams = json.load(f)
        for i, gram in enumerate(n_grams):
            doc = nlp(gram[0].replace("_", " "))
            if not (doc[0].is_stop or doc[-1].is_stop):
                f2.write(doc.text + "," + str(gram[1]) + "\n")


filter_grams()
    
