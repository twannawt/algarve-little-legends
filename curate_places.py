#!/usr/bin/env python3
"""
Curate the extracted places: remove duplicates within batch, 
remove vague/generic entries, and produce a clean list for each category.
"""
import json
import re
from collections import defaultdict

with open('new_places_extracted.json', 'r') as f:
    data = json.load(f)

# More aggressive dedup: group similar names
def fuzzy_key(name):
    n = name.lower().strip()
    # Remove parenthetical
    n = re.sub(r'\s*\([^)]*\)', '', n).strip()
    # Remove common suffixes
    for suffix in [' algarve', ' portugal', ' beach', ' strand']:
        if n.endswith(suffix):
            n = n[:-len(suffix)].strip()
    # Normalize accents
    for a, b in [('ã','a'),('ó','o'),('é','e'),('ê','e'),('í','i'),
                  ('ú','u'),('ç','c'),('â','a'),('à','a'),('õ','o')]:
        n = n.replace(a, b)
    n = re.sub(r'[^a-z0-9\s]', '', n)
    n = re.sub(r'\s+', ' ', n).strip()
    return n

# Places to skip - too generic, vague, hotels, duplicates of existing
SKIP_EXACT = {
    # Duplicates of existing (slightly different names)
    'lagos zoo', 'zoomarine', 'aquashow', 'aquashow park', 'krazyworld',
    'krazy world', 'sand city lagoa', 'sand city', 'castelo de silves',
    'sagres fortress', 'fortaleza de sagres', 'benagil caves', 'benagil cave',
    'algar de benagil', 'benagil cave (algar de benagil)', 'benagil-grot (benagil cave)',
    'ponta da piedade', 'ponte da piedade', 'ponta de piedade',
    'cabo de são vicente', 'tavira castle', 'kasteel van tavira', 'kasteel van silves',
    'slide and splash', 'side & splash (slide & splash)',
    'eden alvor', 'centro ciência viva', 'nosoloágua',
    'aquashow water park', 'zoomarina', 'moorse fort (castelo de silves)',
    'grotten van benagil', 'grotten van lagos', 'vuurtoren van sagres',
    'sagres & kaap sint-vincent', 'ria formosa',
    'silves castle', 'ria formosa natural park',
    # Too vague / generic activities
    'dolfijnen en walvissen spotten', 'dolphin-spotting boottochten',
    'dolphin watching (dolfijnen kijken)', 'dolfijnen kijken',
    'dolfijnentours', 'catamaran dophin watching for families!',
    'boottocht langs de grotten', 'jeeptour algarve', 'algarve jeep safari',
    'jeeptour door de binnenlanden', 'jeep safari', 'surfles westkust',
    'surfles albufeira', 'strandpicknick', 'paardrijden bij de zee',
    'coasteering', 'schelpen zoeken', 'kajakken naar de benagil grot',
    'waterparken', 'kustwandelingen', 'catamaran cruises', 'dolfijnen kijken',
    'family surf sessions', 'coasteering with snorkling',
    'horseback riding', 'fliteboarding with kids!', 
    'guided cave kayaking', 'watersports with private boat',
    'halve day cruize and paddle boarding fun',
    'boottocht naar de grotten van lagos', 'dierenparken',
    'benagil cave tours (benagil grot tours)', 'benagil grot boottocht',
    'dolfijnen en wilde dieren kijken', 'veerboot naar faro strand',
    'vliegtuigen kijken', 'veerboot vanuit olhão',
    'vismotieven zoeken',
    # Hotels/accommodation
    'martinhal quinta de lago', 'donna simone suites', 
    'white shell beach villas', 'boavista golf & spa - bela colina holidays',
    'tivoli lagos', 'vila dos piscos',
    # Too vague locations
    'albufeira', 'caramujeira & benagil', 'vilamoura',
    'natuurgebied ria formosa', 'the 7 hanging valleys trail',
    # Duplicates within batch
    'centro de ciência viva - faro', 'centro de ciência viva - tavira',
    'centro de ciência viva - lagos',
    'quinta do lago mini-golf', 'quinta do lago mini golf', 'mini golf quinta do lago',
    'koko restaurant', 'lobos', 'bovino steakhouse',
    'the shack bar', 'koko lane café',
    'faro tourist train', 'faro toeristentreintje (tourist train)',
    'vilamoura tourist train', 'tourist train lagos', 'albufeira tourist train',
    'praia do camillo',  # duplicate of praia do camilo
    'falésia beach (praia da falésia)',  # already have praia da falesia
    'praia dona ana',  # already have praia da dona ana
    'marinha beach (praia da marinha)',  # already have
    'armona island', 'ilha da armona',  # duplicate
    'corso', 'cafe horizon',  # already have "Corso Beach Bar & Cafe Horizon"
    'carvoeiro tours', 'rocha negra',
    'park jardim da alameda joão de deus',  # might duplicate existing playground
    'praia da galé', 'galé beach (praia da galé)',
    'sé catedral de silves',
    'vale de lobos',
    'vilamoura strand',
    'oude stad (cidade velha)',
    'nieuwe stad (faro)',
    'salema beach',  # already have Praia da Salema
    'praia de ariffana',
    'praia da bordeira',
    'castelejo beach',
    'burgau beach',  # already have Praia do Burgau
    'praia do anção',
    'ilha de tavira',  # might be too vague
    'praia do castelo', # vague
}

# Also skip entries with these patterns
SKIP_PATTERNS = [
    'village square', 'honorio pool', 'armação beach club',
    'the praca', 'esplanada dr',
]

# Now curate
curated = defaultdict(list)
seen_fuzzy = set()

for cat, places in data['by_category'].items():
    for p in places:
        name = p['name'].strip()
        name_lower = name.lower()
        fkey = fuzzy_key(name)
        
        # Skip if in blocklist
        if name_lower in SKIP_EXACT or fkey in SKIP_EXACT:
            continue
        
        # Skip patterns
        if any(pat in name_lower for pat in SKIP_PATTERNS):
            continue
        
        # Skip if fuzzy duplicate already seen
        if fkey in seen_fuzzy:
            continue
        seen_fuzzy.add(fkey)
        
        curated[cat].append(p)

print("=== CURATED PLACES ===\n")
total = 0
for cat in ['restaurant', 'beach', 'playground_activity', 'attraction']:
    places = curated.get(cat, [])
    total += len(places)
    print(f"\n{cat.upper()}: {len(places)} places")
    for p in places:
        loc = p.get('location', '?')
        desc = p.get('description_nl', p.get('description', ''))[:80]
        print(f"  - {p['name']} ({loc})")
        print(f"    {desc}...")

print(f"\n\nTOTAL CURATED: {total}")

# Save curated
with open('curated_new_places.json', 'w', encoding='utf-8') as f:
    json.dump(dict(curated), f, indent=2, ensure_ascii=False)
