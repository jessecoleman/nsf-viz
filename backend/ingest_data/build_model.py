import os
import argparse
from pathlib import Path
import requests
import json
from scipy.stats import logistic
from collections import Counter, OrderedDict, defaultdict
from typing import Generator, Iterable, List, Union
from tqdm import tqdm
import numpy as np
from gensim.corpora.dictionary import Dictionary
from gensim.models import Word2Vec, KeyedVectors, LdaMulticore
from gensim.models.phrases import Phrases, ENGLISH_CONNECTOR_WORDS
from gensim.models.callbacks import CallbackAny2Vec
from gensim.parsing.preprocessing import (
    STOPWORDS,
    preprocess_string,
    strip_tags,
    strip_punctuation,
    strip_multiple_whitespaces,
    strip_numeric,
    remove_stopwords,
    strip_short,
    stem_text
)
import mysql.connector


# keep connector words for ngram analysis
STOP = frozenset.union(
    STOPWORDS - ENGLISH_CONNECTOR_WORDS,
    {'this', 'also'}
)
 
# TODO
norm_map = {}


NGRAM_FILTERS = [
    strip_tags,
    strip_punctuation,
    strip_multiple_whitespaces,
    strip_numeric,
    str.lower,
    lambda s: remove_stopwords(s, stopwords=STOP),
]

W2V_FILTERS = [
    remove_stopwords, # this time remove all stopwords
    strip_short,
    stem_text
]


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


def data_source_ngrams(fpath: Union[str, Path]) -> Generator:
    fpath = Path(fpath)
    with fpath.open() as f:
        for row in f.readlines():
            # pretend everything is a title for W2V
            yield [row, None]


def data_source_elasticsearch() -> Generator:
    from elasticsearch import Elasticsearch
    from elasticsearch_dsl import Search

    host = os.environ.get('ELASTICSEARCH_HOST', 'localhost')
    index = os.environ.get("ELASTICSEARCH_GRANT_INDEX", "grants")
    client = Elasticsearch([{"host": host}], timeout=60)

    search = Search(using=client, index=index)
    for doc in search.scan():
        yield [
            doc.title,
            doc.abstract,
        ]


def get_data(
    output_file: str,
    data_source: Union[Iterable, str] = 'mysql',
    truncate=None,
    process='ngram',
):
    output_file = Path(output_file).resolve()
    assert output_file.parent.exists()

    # TODO make this consistent with other calling sites?
    if data_source == 'mysql':
        data_source = data_source_mysql()
        
    if process == 'ngram':
        filters = NGRAM_FILTERS
    elif process == 'w2v':
        filters = W2V_FILTERS
    else:
        filters = []

    with open(output_file, 'w') as out:
        for i, (title, abstract) in enumerate(tqdm(data_source)):
            out.write(' '.join(preprocess_string(title, filters)) + '\n')
            if abstract:
                out.write(' '.join(preprocess_string(abstract, filters)) + '\n')
            
            if truncate and i > truncate:
                break
        
    print(f"saved to {output_file}")


def stream_sentences(input_file):

    input_file = Path(input_file).resolve()
    print(f"reading input file: {input_file}")
    with open(input_file) as data:
        for line in data:
            yield line.strip().split()
        
        
def build_ngram_model(
    input_file: str,
    bigrams_model_file: str,
    trigrams_model_file: str,
):
        
    MIN_COUNT = 20

    bigrams = Phrases(
        sentences=stream_sentences(input_file),
        min_count=MIN_COUNT,
        threshold=2,
        connector_words=ENGLISH_CONNECTOR_WORDS,
        progress_per=1000
    )
    
    bigrams.save(str(bigrams_model_file))
    
    print('built bigrams')

    trigrams = Phrases(
        sentences=bigrams[stream_sentences(input_file)],
        min_count=MIN_COUNT,
        threshold=2,
        connector_words=ENGLISH_CONNECTOR_WORDS,
        progress_per=1000
    )
    
    trigrams.save(str(trigrams_model_file))
    
    print('built trigrams')

    
def generate_ngrams(
    input_file: str,
    stems_file: str,
    stem_groups_file: str,
    bigrams_model_file: str,
    trigrams_model_file: str,
    ngram_file: str,
):

    ngram_file = Path(ngram_file).resolve()
    assert ngram_file.parent.exists()

    stems_file = Path(stems_file).resolve()
    assert stems_file.parent.exists()

    stem_groups_file = Path(stem_groups_file).resolve()
    assert stem_groups_file.parent.exists()

    # TODO more file validation
    bigrams = Phrases.load(str(bigrams_model_file))
    trigrams = Phrases.load(str(trigrams_model_file))

    sentences = (trigrams[bigrams[s]] for s in stream_sentences(input_file))

    # we want to count occurrances of various forms of stems
   
    counter = Counter()
    stem_groups = defaultdict(Counter)

    # avoid stemming words we already know
    try:
        with open(stems_file, 'r') as stems_handle:
            stems = json.load(stems_handle)
    # if file doesn't exist yet
    # TODO this could be more graceful
    except FileNotFoundError:
        stems = dict()

    host = os.environ.get('ELASTICSEARCH_HOST', 'localhost')
    index = os.environ.get("ELASTICSEARCH_GRANT_INDEX", "grants")

    print(f"saving to {ngram_file}")
    with open(ngram_file, 'w') as out:
        for sentence in sentences:
            for w in sentence:
                w = w.lower()
                if w not in stems:
                    # have not found a great way of using the ES python API to do this
                    # could probably come up with a more performant way of caching this
                    analyzed = requests.post(
                        url=f'http://{host}:9200/{index}/_analyze',
                        json={
                          "analyzer": "aggressive_analyze",
                          "text": w.replace('_', ' ')
                        }
                    )
                    tokens = analyzed.json()
                    stemmed = ' '.join(t['token'] for t in tokens['tokens'])
                    stems[w] = stemmed

                stem_groups[stems[w]][w] += 1
                    
                if w.count('_') > 1:
                    counter[w] += 1

            out.write(' '.join(sentence) + '\n')

    for f, w in counter.most_common(250):
        print(f, w)
        
    stem_groups = OrderedDict(sorted(stem_groups.items(), key=lambda items: len(items[1])))
    with open(stems_file, 'w') as stems_handle:
        json.dump(stems, stems_handle)

    with open(stem_groups_file, 'w') as stem_groups_handle:
        json.dump(stem_groups, stem_groups_handle)

 
def get_phrase_weights(
    data_file: str,
    model_file: str,
    terms_file: str,
    plot=False
):
    '''
    generates terms.txt with following format:
    ...
    {weight} {term}\n
    '''
    terms_file = Path(terms_file).resolve()
    assert terms_file.parent.exists()

    counter = Counter()
    normed = []
    model_file = Path(model_file).resolve()
    print(f"loading model from file: {model_file}")
    model = Word2Vec.load(str(model_file))

    data_file = Path(data_file).resolve()
    print(f"loading data from file: {data_file}")
    # count occurances of each term
    with open(data_file) as data_handle:
        for l in tqdm(data_handle):
            counter.update(**Counter(l.split(' ')))

    # sort words by frequency, truncating at 50
    for w, freq in counter.most_common():
        w = w.lower()
        if freq < 50:
            break
        # ignore stop words and short words
        if w not in STOP and len(w) > 3:
            if w in model.wv:
                # get magnitude of embedding vector
                norm = np.linalg.norm(model.wv[w])
                log_norm = np.log(norm + 1)
                #log_freq = logistic.cdf(freq) #np.log(freq)
                log_freq = np.log(freq)
                # create weighted average of frequency and magnitude
                combined = log_norm * log_freq
                normed.append((w, log_freq, log_norm, combined))

    print(f"writing to {terms_file}")
    with open(terms_file, 'w') as out:
        for w, f, n, c in sorted(normed, key=lambda x: x[2], reverse=True):
            out.write(f'{c} {w}\n')

    if plot:
        # create histogram of terms
        from matplotlib import pyplot as plt

        words, freqs, norms, combined = zip(*normed)
        fig, axes = plt.subplots(1, 4)
        for i, d in enumerate((freqs, norms)):
            axes[i].hist(d)
            
        axes[2].hist(combined)
        axes[3].scatter(freqs, norms)
        plt.savefig('freq_norm_scatter.png')
 

class callback(CallbackAny2Vec):
    def __init__(self):
        self.epoch = 1

    def on_epoch_end(self, model):
        loss = model.get_latest_training_loss()
        if self.epoch == 1:
            print(f'Loss after epoch {self.epoch}: {loss}')
        else:
            print(f'Loss after epoch {self.epoch}: {loss - self.prev_loss}')
        self.epoch += 1
        self.prev_loss = loss


def train_w2v_model(data_file: str, model_file='nsf_fasttext_model'):
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


def train_lda_model(
    input_file: str,
    model_file: str,
):

    with open(input_file, 'r') as inp:
        corpus = [line.split() for line in inp]
        dictionary = Dictionary(corpus)

    corpus = [dictionary.doc2bow(line) for line in corpus]

    model = LdaMulticore(
        corpus=corpus,
        id2word=dictionary,
        num_topics=50,
    )

    for id, topic in model.show_topics(num_topics=20, num_words=30):
        print(id)
        print('\n'.join(topic.split(' + ')))
    model.save(model_file)
    

def cluster_vectors(
    input_file: str,
    model_file: str,
    stem_groups_file: str,
    output_file: str,
):
    
    from sklearn.cluster import KMeans
    
    model = Word2Vec.load(str(model_file))

    print("fitting kmeans clusters to word vectors")
    kmeans = KMeans(n_clusters=50)
    labels = kmeans.fit_predict(model.wv.vectors)
    
    print("getting top words per cluster")
    counter = Counter()

    with open(input_file) as data_handle, \
            open(stem_groups_file) as stem_groups_handle:

        for l in tqdm(data_handle):
            counter.update(l.split(' '))
            
        stem_groups = json.load(stem_groups_handle)

    clusters = defaultdict(list)
    for i, v in enumerate(labels):
        term = model.wv.index_to_key[i]
        # get most common form of stem for topics
        group = stem_groups.get(term, {term: 1})
        most_common_form = sorted(group.items(), key=lambda x: x[1], reverse=True)[0][0]
        clusters[v].append((most_common_form, counter[term]))
        
    top_per_cluster = []
    for cluster in clusters.values():
        s = sorted(cluster, key=lambda x: x[1], reverse=True)[:50]
        print('\n')
        print('\n')
        print('\n'.join(f'{t[0]}: {t[1]}' for t in s[:15]))
        top_per_cluster.append(s)
        
    with open(output_file, 'w') as out:
        json.dump(top_per_cluster, out)


def dispatch(args):
    if args.cmd == 'data':
        if args.data_source.lower() == 'mysql':
            data_source = data_source_mysql()
        elif args.data_source.endswith('.csv'):
            data_source = data_source_csv(args.data_source)
        elif args.data_source.lower().startswith('elastic') or args.data_source.lower() == 'es':
            data_source = data_source_elasticsearch()
        else:
            raise ValueError('invalid value for argument "data-source"')
        get_data(args.output, data_source=data_source)
    elif args.cmd == 'build':
        build_ngram_model(args.intermediate_file, args.data_file)
    elif args.cmd == 'gen_ngrams':
        generate_ngrams(args.intermediate_file, args.data_file)
    elif args.cmd == 'train':
        train_w2v_model(args.data_file, model_file=args.model_file)
    elif args.cmd == 'count':
        get_phrase_weights(args.data_file, model_file=args.model_file, terms_file=args.terms_file)
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