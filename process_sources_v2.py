#!/usr/bin/env python3
"""
Parse wide_browse CSV results from both batches, deduplicate against existing places,
and output new places organized by category.
"""
import csv
import json
import re
import ast
import os
from collections import defaultdict

csv.field_size_limit(1000000)

# Load existing places for dedup
with open('existing_places.txt', 'r') as f:
    existing_names = set()
    for line in f:
        name = line.strip()
        if name:
            existing_names.add(name.lower())

def normalize_name(name):
    """Normalize a place name for dedup comparison"""
    n = name.lower().strip()
    for prefix in ['praia de ', 'praia do ', 'praia da ', 'praia dos ', 'praia das ']:
        if n.startswith(prefix):
            n = n[len(prefix):]
    n = n.replace('ã', 'a').replace('ó', 'o').replace('é', 'e').replace('ê', 'e')
    n = n.replace('í', 'i').replace('ú', 'u').replace('ç', 'c').replace('â', 'a')
    n = n.replace('à', 'a').replace('õ', 'o')
    n = re.sub(r'[^a-z0-9\s]', '', n)
    n = re.sub(r'\s+', ' ', n).strip()
    return n

existing_normalized = set()
for name in existing_names:
    existing_normalized.add(normalize_name(name))

# Also load existing JSON files
for json_file in ['research/restaurants.json', 'research/beaches.json', 
                   'research/playgrounds_activities.json', 'research/attractions.json']:
    with open(json_file, 'r') as f:
        data = json.load(f)
        for place in data:
            existing_normalized.add(normalize_name(place['name']))
            existing_names.add(place['name'].lower())

print(f"Existing places: {len(existing_names)} names, {len(existing_normalized)} normalized")

def parse_csv_places(csv_path):
    """Parse places from a wide_browse CSV result"""
    places = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            places_col = row.get('Places Found', '')
            source_url = row.get('Source URL', '')
            
            url_match = re.search(r'\((https?://[^)]+)\)', source_url)
            source = url_match.group(1) if url_match else source_url
            
            if not places_col or places_col.strip() == '':
                continue
            
            place_list = None
            # Try JSON first
            try:
                place_list = json.loads(places_col)
            except json.JSONDecodeError:
                pass
            
            # Try Python literal eval (handles single quotes)
            if place_list is None:
                try:
                    place_list = ast.literal_eval(places_col)
                except (ValueError, SyntaxError):
                    pass
            
            # Try fixing common issues
            if place_list is None:
                try:
                    fixed = places_col.replace("'", '"')
                    # Handle escaped double quotes inside
                    fixed = re.sub(r'""([^"]+)""', r'"\1"', fixed)
                    place_list = json.loads(fixed)
                except:
                    pass
            
            if place_list is None:
                print(f"  FAILED to parse: {source[:80]}...")
                continue
                
            if isinstance(place_list, list):
                for p in place_list:
                    if isinstance(p, dict) and 'name' in p:
                        p['_source'] = source
                        places.append(p)
    return places

batch1_places = parse_csv_places('../wide/browse_results_mmvvxum6.csv')
batch2_places = parse_csv_places('../wide/browse_results_mmvw3obn.csv')

print(f"\nBatch 1: {len(batch1_places)} raw places extracted")
print(f"Batch 2: {len(batch2_places)} raw places extracted")

all_raw = batch1_places + batch2_places
print(f"Total raw: {len(all_raw)} places")

# Filter patterns - things that are too generic
SKIP_NAMES = {
    'algarve', 'algarve region', 'soft play center', 'binnenspeeltuin',
    'soft play centers (binnenspeeltuinen)', 'beach picnics & shell searching',
    'carvoeiro (stadje)', 'strand bij faro', 'lagos', 'silves', 'tavira', 
    'monte gordo', 'faro', 'sagres', 'olhão',
}

SKIP_PREFIXES = [
    'restaurant bij ', 'clubhouse en restaurant bij ',
    'vissershaven van ', 'kathedraal van ', 'fort van ',
    'restaurant bij mikki', 'clubhouse en restaurant',
]

def should_skip(name):
    n = name.lower().strip()
    if len(n) < 3:
        return True
    if n in SKIP_NAMES:
        return True
    for prefix in SKIP_PREFIXES:
        if n.startswith(prefix):
            return True
    # Skip hotel/resort/accommodation entries (not places to visit)
    if any(x in n for x in ['hotel', 'resort', 'martinhal', 'to stay']):
        return True
    return False

# Deduplicate - more aggressive matching
def get_dedup_keys(name):
    """Return multiple keys to match against for dedup"""
    keys = set()
    n = normalize_name(name)
    keys.add(n)
    
    # Also try without parenthetical content
    no_paren = re.sub(r'\([^)]*\)', '', name).strip()
    keys.add(normalize_name(no_paren))
    
    # Handle "X Beach" = "Praia X"
    if 'beach' in name.lower():
        cleaned = name.lower().replace(' beach', '').strip()
        keys.add(normalize_name(cleaned))
    
    return keys

seen_normalized = set()
new_places = []
skipped_existing = 0
skipped_generic = 0
skipped_duplicate = 0

for p in all_raw:
    name = p.get('name', '').strip()
    if not name:
        continue
    
    if should_skip(name):
        skipped_generic += 1
        continue
    
    dedup_keys = get_dedup_keys(name)
    
    # Check against existing
    if any(k in existing_normalized for k in dedup_keys) or name.lower() in existing_names:
        skipped_existing += 1
        continue
    
    # Check against already-seen in this batch
    if any(k in seen_normalized for k in dedup_keys):
        skipped_duplicate += 1
        continue
    
    for k in dedup_keys:
        seen_normalized.add(k)
    new_places.append(p)

print(f"\n--- Dedup Results ---")
print(f"Skipped (already exists): {skipped_existing}")
print(f"Skipped (too generic/hotel): {skipped_generic}")
print(f"Skipped (duplicate in batch): {skipped_duplicate}")
print(f"NEW places to add: {len(new_places)}")

# Categorize
categories = defaultdict(list)
for p in new_places:
    cat = p.get('category', 'unknown').lower().strip()
    name = p['name']
    
    if cat in ['restaurant', 'restaurants']:
        categories['restaurant'].append(p)
    elif cat in ['beach', 'beaches', 'strand']:
        categories['beach'].append(p)
    elif cat in ['playground_activity', 'playground', 'activity', 'activities']:
        categories['playground_activity'].append(p)
    elif cat in ['attraction', 'attractions']:
        categories['attraction'].append(p)
    else:
        name_lower = name.lower()
        desc = p.get('description_nl', '').lower()
        if 'praia' in name_lower or 'beach' in name_lower or 'strand' in name_lower:
            categories['beach'].append(p)
        elif any(x in name_lower for x in ['restaurant', 'café', 'cafe', 'pizzeria', 'bistro', 'bar ']):
            categories['restaurant'].append(p)
        else:
            categories['attraction'].append(p)

print(f"\n--- By Category ---")
for cat, places in sorted(categories.items()):
    print(f"\n  {cat}: {len(places)} places")
    for p in places:
        print(f"    - {p['name']} ({p.get('location', '?')})")

# Save results
output = {
    'by_category': {k: v for k, v in categories.items()},
    'stats': {
        'total_raw': len(all_raw),
        'skipped_existing': skipped_existing,
        'skipped_generic': skipped_generic,
        'skipped_duplicate': skipped_duplicate,
        'new_total': len(new_places),
    }
}

with open('new_places_extracted.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"\nSaved to new_places_extracted.json")
