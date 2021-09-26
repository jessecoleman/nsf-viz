import json
import re
import json

divs = set()
div_keys = {}

def get_official_keys():
    keys = {
        'nsf': {},
        'nih': {}
    }

    for org in 'nsf', 'nih':
        with open(f'{org}_map.txt') as f:
            for l in f:
                if l.isspace():
                    continue
                name, _, key, *_ = re.split(r'(\(|\))', l)
                keys[org][key] = name.strip()
                
        print(json.dumps(keys, indent=2))
            
    # check for collisions
    assert len(set(keys['nsf']).intersection(keys['nih'])) == 0
    out = [{
        'key': k,
        'name': v,
        'selected': False
     } for k, v in keys['nih'].items()]
    print(json.dumps(out, indent=2))


def normalize(div: str):
    normed = []
    for w in div.split():
        if (w[0].isalpha() and w.lower() not in ('of', 'and', 'for', '&')
            and not (w.lower().startswith('div') and not w.lower() == 'diversity')
            and not w.lower().startswith('office')
            and not w.lower().startswith('direct')):
        
            normed.append(w.lower())
    
    return ' '.join(normed)


def create_uniq_keys(official, div_file):
    with open(div_file) as f:
        for div in f:
            abbr = ''
            
            div = div.strip()
            divs.add(div)
            
            words = div.split()
            
            # already abbreviated
            if len(words) == 1 and len([c == c.upper() for c in div]) > 1:
                abbr = div.lower()
            
            else:
                normed = normalize(div)
                abbr = [w[0].upper() for w in normed.split(' ')]

            if abbr not in div_keys:
                div_keys[abbr] = div
            
            else:
                i = 1
                while f'{abbr}{i}' in div_keys:
                    print('collision:', div, f'{abbr}{i}')
                    i += 1
                    
                div_keys[f'{abbr}{i}'] = div

    # check for collisions
    assert len(divs - set(div_keys.values())) == 0
    out = [{
        'key': k,
        'name': v,
        'selected': False
     } for k, v in div_keys.items()]
    print(json.dumps(out, indent=2))


if __name__ == '__main__':
    official_keys = get_official_keys()
    # create_uniq_keys(official_keys, 'divisions.txt')