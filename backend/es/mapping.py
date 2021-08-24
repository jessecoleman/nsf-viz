mapping = {
    'settings': {
        'similarity': {
            'bm25': {
                'type': 'BM25',
                'b': 0.5,
                'k1': 2
            },
            'tf': {
                'type': 'scripted',
                'script': {
                    'source': 'doc.freq'
                }
            },
        },
        'analysis': {
            'filter': {
                'english_stop': {
                    'type': 'stop',
                    'stopwords': '_english_'
                },
                's_stemmer': {
                    'type': 'stemmer',
                    'name': 'minimal_english'
                },
                'english_possessive_stemmer': {
                    'type': 'stemmer',
                    'language': 'possessive_english'
                },
                'english_stemmer': {
                    'type': 'stemmer',
                    'language': 'english'
                },
                '2_grams': {
                    'type': 'shingle',
                    'max_shingle_size': 2,
                    'min_shingle_size': 2,
                    'output_unigrams': False,
                    'output_unigrams_if_no_shingles': False
                },
                '3_grams': {
                    'type': 'shingle',
                    'max_shingle_size': 3,
                    'min_shingle_size': 3,
                    'output_unigrams': False,
                    'output_unigrams_if_no_shingles': False
                }
            },
            'analyzer': {
                'simple_analyze': {
                    'tokenizer': 'standard',
                        'filter': [
                            'lowercase',
                            'english_possessive_stemmer', 
                            's_stemmer'
                        ]
                    },
                'aggressive_analyze': {
                    'tokenizer': 'standard',
                    'filter': [
                        'lowercase',
                        'english_possessive_stemmer',
                        'english_stemmer',
                        'english_stop',
                        'asciifolding',
                        'unique'
                    ]
                },
                'bag_of_words_analyze': {
                    'tokenizer': 'standard',
                    'filter':[
                        'lowercase',
                        'english_possessive_stemmer',
                        'english_stemmer',
                        'asciifolding',
                        'unique'
                    ]
                },
                'keyword_analyze': {
                    'tokenizer': 'keyword',
                    'filter': [
                        'lowercase',
                        'english_possessive_stemmer',
                        'english_stemmer',
                        'english_stop',
                        'asciifolding',
                        'unique'
                    ]
                },
                '2_gram_analyze': {
                   'tokenizer': 'standard',
                   'filter': [
                       'lowercase',
                       'english_stemmer',
                       's_stemmer',
                       '2_grams'
                    ]
                },
                '3_gram_analyze': {
                   'tokenizer': 'standard',
                   'filter': [
                       'lowercase',
                       'english_possessive_stemmer',
                       's_stemmer',
                       '3_grams'
                    ]
                }
            },
        }
    },  
    'mappings': {
        '_doc': {
            'properties': {
                'name':{
                    'type': 'text',
                    'analyzer': 'simple_analyze',
                    'similarity': 'bm25',
                },
                'abstract': { 
                    'type': 'text',
                    'analyzer': 'simple_analyze',
                    'similarity': 'bm25',
                    'term_vector': 'with_position_offsets',
                },
                'division': {
                    'type': 'keyword',
                },
                'date': {
                    'type': 'date',
                },
                'amount': {
                    'type': 'integer',
                }
            }
        }
    }
}