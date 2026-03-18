#!/usr/bin/env python3
"""
Parse wide_browse CSV results from both batches, deduplicate against existing places,
and output new places organized by category.
"""
import csv
import json
import re
import os
from collections import defaultdict

# Load existing places for dedup
with open('existing_places.txt', 'r') as f:
    existing_names = set()
    for line in f:
        name = line.strip()
        if name:
            existing_names.add(name.lower())

# Also create a set of normalized names (without accents, common variations)
def normalize_name(name):
    """Normalize a place name for dedup comparison"""
    n = name.lower().strip()
    # Remove common prefixes
    for prefix in ['praia de ', 'praia do ', 'praia da ', 'praia dos ', 'praia das ']:
        if n.startswith(prefix):
            n = n[len(prefix):]
    # Common substitutions
    n = n.replace('ã', 'a').replace('ó', 'o').replace('é', 'e').replace('ê', 'e')
    n = n.replace('í', 'i').replace('ú', 'u').replace('ç', 'c').replace('â', 'a')
    n = n.replace('à', 'a').replace('õ', 'o')
    n = re.sub(r'[^a-z0-9\s]', '', n)
    n = re.sub(r'\s+', ' ', n).strip()
    return n

existing_normalized = set()
for name in existing_names:
    existing_normalized.add(normalize_name(name))

# Also load existing JSON files to get full names
for json_file in ['research/restaurants.json', 'research/beaches.json', 
                   'research/playgrounds_activities.json', 'research/attractions.json']:
    with open(json_file, 'r') as f:
        data = json.load(f)
        for place in data:
            existing_normalized.add(normalize_name(place['name']))
            existing_names.add(place['name'].lower())

print(f"Existing places: {len(existing_names)} names, {len(existing_normalized)} normalized")

# Parse CSV results
def parse_csv_places(csv_path):
    """Parse places from a wide_browse CSV result"""
    places = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            places_col = row.get('Places Found', '')
            source_url = row.get('Source URL', '')
            
            # Extract URL from markdown link
            url_match = re.search(r'\((https?://[^)]+)\)', source_url)
            source = url_match.group(1) if url_match else source_url
            
            if not places_col or places_col.strip() == '':
                continue
            
            try:
                place_list = json.loads(places_col)
                if isinstance(place_list, list):
                    for p in place_list:
                        if isinstance(p, dict) and 'name' in p:
                            p['_source'] = source
                            places.append(p)
            except json.JSONDecodeError:
                # Try to fix common JSON issues
                try:
                    fixed = places_col.replace('\r\n', '\n').replace('\r', '\n')
                    place_list = json.loads(fixed)
                    if isinstance(place_list, list):
                        for p in place_list:
                            if isinstance(p, dict) and 'name' in p:
                                p['_source'] = source
                                places.append(p)
                except:
                    print(f"  Could not parse places from row with source: {source_url[:80]}")
    return places

batch1_places = parse_csv_places('../wide/browse_results_mmvvxum6.csv')
batch2_places = parse_csv_places('../wide/browse_results_mmvw3obn.csv')

print(f"\nBatch 1: {len(batch1_places)} raw places extracted")
print(f"Batch 2: {len(batch2_places)} raw places extracted")

all_raw = batch1_places + batch2_places
print(f"Total raw: {len(all_raw)} places")

# Filter out generic/vague entries and known existing places
SKIP_PATTERNS = [
    'algarve', 'algarve region', 'soft play center', 'binnenspeeltuin',
    'beach picnic', 'shell search', 'diverse', 'verschillende', 'generic',
    'restaurant bij', 'clubhouse en restaurant', 'carvoeiro (stadje)',
    'strand bij faro', 'lagos', 'silves', 'tavira', 'monte gordo',
    'vissershaven', 'kathedraal van', 'fort van',
]

def should_skip(name):
    """Check if a place name is too generic or vague"""
    n = name.lower().strip()
    if len(n) < 3:
        return True
    for pattern in SKIP_PATTERNS:
        if n == pattern or n.startswith(pattern + ' ') or pattern in n:
            # But allow specific places that contain these words
            if len(n) > len(pattern) + 5 and pattern not in ['restaurant bij', 'clubhouse en restaurant']:
                continue
            return True
    return False

# Deduplicate
seen_normalized = set()
new_places = []
skipped_existing = []
skipped_generic = []
skipped_duplicate = []

for p in all_raw:
    name = p.get('name', '').strip()
    if not name:
        continue
    
    norm = normalize_name(name)
    
    # Skip if too generic
    if should_skip(name):
        skipped_generic.append(name)
        continue
    
    # Skip if exists in current database
    if norm in existing_normalized or name.lower() in existing_names:
        skipped_existing.append(name)
        continue
    
    # Skip if already seen in this batch
    if norm in seen_normalized:
        skipped_duplicate.append(name)
        continue
    
    seen_normalized.add(norm)
    new_places.append(p)

print(f"\n--- Dedup Results ---")
print(f"Skipped (already exists): {len(skipped_existing)}")
print(f"Skipped (too generic): {len(skipped_generic)}")
print(f"Skipped (duplicate in batch): {len(skipped_duplicate)}")
print(f"NEW places to add: {len(new_places)}")

# Categorize
categories = defaultdict(list)
for p in new_places:
    cat = p.get('category', 'unknown').lower().strip()
    if cat in ['restaurant', 'restaurants']:
        categories['restaurant'].append(p)
    elif cat in ['beach', 'beaches', 'strand']:
        categories['beach'].append(p)
    elif cat in ['playground_activity', 'playground', 'activity', 'activities', 'playground_activities']:
        categories['playground_activity'].append(p)
    elif cat in ['attraction', 'attractions']:
        categories['attraction'].append(p)
    else:
        # Guess from name/description
        name_lower = name.lower()
        desc = p.get('description_nl', '').lower() + p.get('description', '').lower()
        if 'praia' in name_lower or 'beach' in name_lower or 'strand' in name_lower:
            categories['beach'].append(p)
        elif 'restaurant' in name_lower or 'café' in name_lower or 'pizzeria' in name_lower:
            categories['restaurant'].append(p)
        else:
            categories['attraction'].append(p)

print(f"\n--- By Category ---")
for cat, places in sorted(categories.items()):
    print(f"  {cat}: {len(places)} places")
    for p in places:
        print(f"    - {p['name']} ({p.get('location', '?')})")

# Save results
output = {
    'new_places': new_places,
    'by_category': {k: v for k, v in categories.items()},
    'stats': {
        'total_raw': len(all_raw),
        'skipped_existing': len(skipped_existing),
        'skipped_generic': len(skipped_generic),
        'skipped_duplicate': len(skipped_duplicate),
        'new_total': len(new_places),
    }
}

with open('new_places_extracted.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"\nSaved to new_places_extracted.json")
