from collections import Counter, defaultdict
from itertools import chain
from tqdm import tqdm
import numpy as np
from matplotlib import pyplot as plt
from gensim.models import Word2Vec, FastText
from gensim.models.phrases import Phrases, ENGLISH_CONNECTOR_WORDS
from gensim.models.callbacks import CallbackAny2Vec
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import WordNetLemmatizer
import mysql.connector


def nltk_download():
    nltk.download('stopwords')
    nltk.download('punkt')
    nltk.download('wordnet')


word_tokenizer = nltk.RegexpTokenizer(r'\w+')
lemmatizer = WordNetLemmatizer()
stop = set(stopwords.words('english'))
stop.add(',')
stop.add('.')
stop.add('this')
stop.add('also')
 
filter_stop = lambda w: w.lower() not in stop
norm_word = lambda w: lemmatizer.lemmatize(w.lower())
 
def process_text(text: str):
    t_text = sent_tokenize(text.replace('<br/>', ' '))
    w_text = [word_tokenizer.tokenize(s) for s in t_text]
    f_text = [norm_word(w) for w in chain.from_iterable(w_text) if filter_stop(w)]
    return f_text
 

def get_data(data_file: str):
    db = mysql.connector.connect(host="localhost",
            database="nsf",
            user="nsf",
            password="!DLnsf333")
    
    cursor = db.cursor()
    
    cursor.execute("select AwardTitle, AbstractNarration from Award")
  
    result = cursor.fetchall()
    t_sentences = []
    for title, abstract in tqdm(result):
        t_sentences.extend([
            process_text(title),
            process_text(abstract)
        ])
    
    bigram_model = Phrases(
        t_sentences,
        min_count=5,
        threshold=1,
        connector_words=ENGLISH_CONNECTOR_WORDS
    )
    sentences = [bigram_model[s] for s in t_sentences]

    trigram_model = Phrases(
        sentences,
        min_count=3,
        threshold=1,
        connector_words=ENGLISH_CONNECTOR_WORDS
    )
    sentences = [trigram_model[s] for s in t_sentences]

    quadgram_model = Phrases(
        sentences,
        min_count=2,
        threshold=1,
        connector_words=ENGLISH_CONNECTOR_WORDS
    )
    sentences = [quadgram_model[s] for s in t_sentences]

    with open(data_file, 'w') as data:
        data.write('\n'.join(' '.join(s) for s in sentences))


def count_phrases(data):
    counter = Counter()
    normed = []
    model = Word2Vec.load('../assets/nsf_fasttext_model')
    with open(data) as d:
        lines = list(d)
        for l in tqdm(lines):
            counter.update(**Counter(l.split(' ')))

    for w, f in counter.most_common():
        if w not in stop and len(w) > 3 and f > 50:
            if w in model.wv:
                norm = np.linalg.norm(model.wv[w])
                normed.append((w, f, norm, np.log(f) * np.log(norm)))

    # words, freqs, mags = zip(*normed)
    with open('../assets/terms.txt', 'w') as out:
        for w, f, n, a in sorted(normed, key=lambda x: x[3], reverse=True):
            out.write(f'{a} {w}\n')

    # for i, d in enumerate((freqs, mags)):
    #     plt.hist(np.log(d))
    #     plt.savefig(f'{i}.png')
 

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
    model = FastText(
        vector_size=64,
        window=5,
        min_count=5,
        corpus_file=data_file,
        epochs=15,
        compute_loss=True,
        callbacks=[callback()]
    )

    model.save("nsf_fasttext_model")
    return model


def test_model(model):
    for kw in 'data_science', 'machine_learning', 'artificial_intelligence':
            similar = model.wv.most_similar([kw], [])
            print(similar)


data_file = '../assets/data.txt'
#get_data(data_file)
model = train_model(data_file)
#count_phrases(data_file)
#test_model(model)