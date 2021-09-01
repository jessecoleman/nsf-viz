import os
import argparse
from pathlib import Path
import json
from collections import Counter
from itertools import chain
from typing import Generator, Iterable, List, Union
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
 

def data_source_mysql() -> List:
    db = mysql.connector.connect(host="localhost",
            database="nsf",
            user="nsf",
            password="!DLnsf333")
    
    cursor = db.cursor()
    
    cursor.execute("select AwardTitle, AbstractNarration from Award")
  
    return cursor.fetchall()

def data_source_csv(fpath: Union[str, Path]) -> Generator:
    import csv
    # csv schema is: 'idx,AwardTitle,AbstractNarration,AwardAmount,AwardEffectiveDate,DivisionCode,DivisionLongName'
    fpath = Path(fpath)
    with fpath.open() as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if i == 0:
                # header row
                continue

            yield [
                row[1],  # title
                row[2],  # abstract
            ]


def get_data(intermediate_file: str, data_source: Union[Iterable, str] = 'mysql'):
    intermediate_file = Path(intermediate_file).resolve()
    assert intermediate_file.parent.exists()

    if data_source == 'mysql':
        data_source = data_source_mysql()

    sentences = []
    for title, abstract in tqdm(data_source):
        sentences.extend([
            process_text(title),
            process_text(abstract)
        ])
        
    print(f"saving to {intermediate_file}")
    with open(intermediate_file, 'w') as out:
        json.dump(sentences, out)
    
    
def build_gram_model(input_file, data_file):

    data_file = Path(data_file).resolve()
    assert data_file.parent.exists()

    input_file = Path(input_file).resolve()
    print(f"reading input file: {input_file}")
    with open(input_file) as data:
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

    print(f"saving to {data_file}")
    with open(data_file, 'w') as data:
        data.write('\n'.join(' '.join(s) for s in sentences))


def count_phrases(data, model_file='../assets/nsf_fasttext_model', terms_file='../assets/terms.txt', explore=False):
    terms_file = Path(terms_file).resolve()
    assert terms_file.parent.exists()

    counter = Counter()
    normed = []
    model_file = Path(model_file).resolve()
    print(f"loading model from file: {model_file}")
    model = Word2Vec.load(str(model_file))

    data = Path(data).resolve()
    print(f"loading data from file: {data}")
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

    print(f"writing to {terms_file}")
    with open(terms_file, 'w') as out:
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


def train_model(data_file: str, model_file='nsf_fasttext_model'):
    model_file = Path(model_file).resolve()
    assert model_file.parent.exists()

    data_file = Path(data_file).resolve()
    print(f"using data file: {data_file}")
    model = Word2Vec(
        vector_size=64,
        window=5,
        min_count=5,
        corpus_file=str(data_file),
        epochs=15,
        compute_loss=True,
        callbacks=[callback()]
    )

    print(f"saving to {model_file}")
    model.save(str(model_file))
    return model


def test_model(model):
    for kw in 'data_science', 'machine_learning', 'artificial_intelligence':
            similar = model.wv.most_similar([kw], [])
            print(similar)

def dispatch(args):
    if args.cmd == 'data':
        if args.data_source.lower() == 'mysql':
            data_source = data_source_mysql()
        elif args.data_source.endswith('.csv'):
            data_source = data_source_csv(args.data_source)
        else:
            raise ValueError('invalid value for argument "data-source"')
        get_data(args.output, data_source=data_source)
    elif args.cmd == 'build':
        build_gram_model(args.intermediate_file, args.data_file)
    elif args.cmd == 'train':
        train_model(args.data_file, model_file=args.model_file)
    elif args.cmd == 'count':
        count_phrases(args.data_file, model_file=args.model_file, terms_file=args.terms_file)
    elif args.cmd == 'test':
        model = Word2Vec.load(args.model_file)
        test_model(model)
    else:
        raise RuntimeError('invalid command')

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.realpath(__file__))
    intermediate_file = os.path.join(script_dir, '../assets/intermediate.txt')
    data_file = os.path.join(script_dir, '../assets/data.txt')
    model_file = os.path.join(script_dir, '../assets/nsf_w2v_model')
    terms_file = os.path.join(script_dir, '../assets/terms.txt')

    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest='cmd')  # stores the subparser's name in a "cmd" attribute

    parser_00_data = subparsers.add_parser('data')
    parser_00_data.add_argument('output', nargs='?', default=intermediate_file)
    parser_00_data.add_argument("--data-source", default='mysql', help="Source for data (default: mysql database)")

    parser_01_build = subparsers.add_parser('build')
    parser_01_build.add_argument('intermediate_file', nargs='?', default=intermediate_file)
    parser_01_build.add_argument('data_file', nargs='?', default=data_file)

    parser_02_train = subparsers.add_parser('train')
    parser_02_train.add_argument('data_file', nargs='?', default=data_file)
    parser_02_train.add_argument('model_file', nargs='?', default=model_file)

    parser_03_count = subparsers.add_parser('count')
    parser_03_count.add_argument('data_file', nargs='?', default=data_file)
    parser_03_count.add_argument('model_file', nargs='?', default=model_file)
    parser_03_count.add_argument('terms_file', nargs='?', default=terms_file)

    parser_04_test = subparsers.add_parser('test')
    parser_04_test.add_argument('model_file', nargs='?', default=model_file)

    args = parser.parse_args()
    dispatch(args)
    #get_data(intermediate_file)
    # build_gram_model(intermediate_file, data_file)
    #model = train_model(data_file)
    #count_phrases(data_file)
    #test_model(model)