import json
from collections import Counter
from itertools import chain
from tqdm import tqdm
import numpy as np
from gensim.models import Word2Vec, FastText
from gensim.models.phrases import Phrases, ENGLISH_CONNECTOR_WORDS
from gensim.models.callbacks import CallbackAny2Vec
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize
from nltk.stem import WordNetLemmatizer
import mysql.connector


def nltk_download():
    nltk.download('stopwords')
    nltk.download('punkt')
    nltk.download('wordnet')


word_tokenizer = nltk.RegexpTokenizer(r'\w+') # TODO do we like this tokenizer?
lemmatizer = WordNetLemmatizer()
stop = set(stopwords.words('english'))
stop.update({',', '.', 'this', 'also'})
# keep connector words for ngram analysis
stop = stop - ENGLISH_CONNECTOR_WORDS
 
filter_stop = lambda w: w.lower() not in stop
norm_word = lambda w: lemmatizer.lemmatize(w.lower())


def process_text(text: str):
    t_text = sent_tokenize(text.replace('<br/>', ' '))
    w_text = [word_tokenizer.tokenize(s) for s in t_text]
    f_text = [norm_word(w) for w in chain.from_iterable(w_text) if filter_stop(w)]
    return f_text
 

def get_data(intermediate_file: str):
    db = mysql.connector.connect(host="localhost",
            database="nsf",
            user="nsf",
            password="!DLnsf333")
    
    cursor = db.cursor()
    
    cursor.execute("select AwardTitle, AbstractNarration from Award")
  
    result = cursor.fetchall()
    sentences = []
    for title, abstract in tqdm(result):
        sentences.extend([
            process_text(title),
            process_text(abstract)
        ])
        
    with open(f'../assets/{intermediate_file}', 'w') as out:
        json.dump(sentences, out)
    
    
def build_gram_model(input_file, data_file):

    with open(f'../assets/{input_file}') as data:
        sentences = json.load(data)
        
    bigram = Phrases(
        sentences,
        min_count=5,
        threshold=2,
        connector_words=ENGLISH_CONNECTOR_WORDS,
        progress_per=1000
    )
    
    print('built bigrams')

    trigram = Phrases(
        bigram[sentences],
        min_count=5,
        threshold=2,
        connector_words=ENGLISH_CONNECTOR_WORDS,
        progress_per=1000
    )
    
    print('built trigrams')

    quadgram = Phrases(
        trigram[bigram[sentences]],
        min_count=5,
        threshold=2,
        connector_words=ENGLISH_CONNECTOR_WORDS
    )

    print('built quadgrams')
    sentences = [quadgram[trigram[bigram[s]]] for s in sentences]
    
    counter = Counter()
    for s in sentences:
        for w in s:
            if w.count('_') > 1:
                counter[w] += 1

    for f, w in counter.most_common(250):
        print(f, w)

    with open(f'../assets/{data_file}', 'w') as data:
        data.write('\n'.join(' '.join(s) for s in sentences))


def count_phrases(data, explore=False):
    counter = Counter()
    normed = []
    model = Word2Vec.load('../assets/nsf_fasttext_model')
    with open(data) as d:
        lines = list(d)
        for l in tqdm(lines):
            counter.update(**Counter(l.split(' ')))

    for w, f in counter.most_common():
        if f < 50:
            break
        if w not in stop and len(w) > 3:
            if w in model.wv:
                norm = np.linalg.norm(model.wv[w])
                combined = np.log(f) * np.log(norm)
                normed.append((w, f, norm, combined))

    with open('../assets/terms.txt', 'w') as out:
        for w, f, n, c in sorted(normed, key=lambda x: x[3], reverse=True):
            out.write(f'{c} {w}\n')

    if explore:
        from matplotlib import pyplot as plt

        words, freqs, mags = zip(*normed)
        for i, d in enumerate((freqs, mags)):
            plt.hist(np.log(d))
            plt.savefig(f'{i}.png')
 

class callback(CallbackAny2Vec):
    def __init__(self):
        self.epoch = 0

    def on_epoch_end(self, model):
        loss = model.get_latest_training_loss()
        if self.epoch == 0:
            print(f'Loss after epoch {self.epoch}: {loss}')
        else:
            print(f'Loss after epoch {self.epoch}: {loss - self.prev_loss}')
        self.epoch += 1
        self.prev_loss = loss


def train_model(data_file: str):
    model = Word2Vec(
        vector_size=64,
        window=5,
        min_count=5,
        corpus_file=data_file,
        epochs=15,
        compute_loss=True,
        callbacks=[callback()]
    )

    model.save('nsf_fasttext_model')
    return model


def test_model(model):
    for kw in 'data_science', 'machine_learning', 'artificial_intelligence':
            similar = model.wv.most_similar([kw], [])
            print(similar)


if __name__ == '__main__':
    intermediate_file = 'intermediate.txt'
    data_file = 'data.txt'
    #get_data(intermediate_file)
    build_gram_model(intermediate_file, data_file)
    #model = train_model(data_file)
    #count_phrases(data_file)
    #test_model(model)