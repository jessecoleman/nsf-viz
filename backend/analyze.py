from audioop import reverse
from gensim.models import KeyedVectors
from gensim.models import Phrases
from typing import List


def get_related(
    abstract: str,
    terms: List[str],
    phraser: Phrases,
    word_vecs: KeyedVectors,
    cutoff: int=5,
):
  
    phrases = phraser[[abstract.lower().split()]][0]
    phrases = set(p for p in phrases if '_' in p)
    terms = get_indexed_terms(terms, word_vecs)
    
    if len(terms) == 0:
      return []

    print(phrases, terms)
    similarities = []

    for phrase in phrases:
        if word_vecs.key_to_index.get(phrase):
            similarity = word_vecs.n_similarity([phrase], terms)
            similarities.append((similarity, phrase.replace('_', ' ')))
          
        else:
            print(f'no key for {phrase}')
            
    if len(similarities) == 0:
      return []

    related = sorted(similarities, key=lambda x: x[0], reverse=True)
    for s, p in related:
        print(s, '\t', p)
      
    scores, words = zip(*related)
    return list(words[:cutoff])

 
def get_indexed_terms(
    terms: List[str],
    word_vecs: KeyedVectors,
):

    indexed_terms = [
        term.lower().replace(' ', '_') for term in terms
        if word_vecs.key_to_index.get(term, False)
    ]
    
    print(indexed_terms)
    # try using individual words if phrases are missing
    if len(indexed_terms) == 0:
        indexed_terms = [
            subterm for term in terms for subterm in term.lower().split(' ')
            if word_vecs.key_to_index.get(subterm, False)
        ]
        
    return indexed_terms

