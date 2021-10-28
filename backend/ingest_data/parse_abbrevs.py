# -*- coding: utf-8 -*-

import os
import json
from pathlib import Path
from typing import Dict

DESCRIPTION = """categories / abbreviations"""

FILENAME_ABBREVIATIONS = "abbreviations.json"
FILENAME_NSF_MAPPED = 'mapped.json'

def normalize(div: str) -> str:
    normed = []
    for w in div.split():
        if (w[0].isalpha() and w.lower() not in ('of', 'and', 'for', '&')
            and not (w.lower().startswith('div') and not w.lower() == 'diversity')
            and not w.lower().startswith('office')
            and not w.lower().startswith('direct')):

            normed.append(w.lower())

    return ' '.join(normed)

script_dirpath = Path(os.path.dirname(os.path.realpath(__file__)))

fp = script_dirpath.joinpath(FILENAME_ABBREVIATIONS)
abbrevs: Dict[str, Dict[str, str]]  # type hint for abbrevs variable 
abbrevs = json.loads(fp.read_text())

fp = script_dirpath.joinpath(FILENAME_NSF_MAPPED)
nsf_mapped = json.loads(fp.read_text())


nsf_mapped_reversed = {}
for k, v in nsf_mapped.items():
    for item in v:
        assert item not in nsf_mapped_reversed.keys()
        nsf_mapped_reversed[item] = k

abbrevs_flat = {}
for agency, v in abbrevs.items():
    for abbrev, longname in v.items():
        assert longname not in abbrevs_flat.keys()
        abbrevs_flat[normalize(longname)] = abbrev.lower()
