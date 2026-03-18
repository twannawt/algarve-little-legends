#!/usr/bin/env python3
"""
Build proper JSON entries for new places and merge into existing research/*.json files.
Uses the curated list and existing schema format.
"""
import json

with open('curated_new_places.json', 'r') as f:
    curated = json.load(f)

# Load existing data
with open('research/restaurants.json', 'r') as f:
    existing_restaurants = json.load(f)
with open('research/beaches.json', 'r') as f:
    existing_beaches = json.load(f)
with open('research/playgrounds_activities.json', 'r') as f:
    existing_activities = json.load(f)
with open('research/attractions.json', 'r') as f:
    existing_attractions = json.load(f)

# === RESTAURANTS ===
new_restaurants = []
for p in curated.get('restaurant', []):
    name = p['name']
    loc = p.get('location', '')
    desc = p.get('description_nl', p.get('description', ''))
    source = p.get('_source', '')
    age = p.get('age_info', '')
    
    entry = {
        "name": name,
        "location": loc,
        "latitude": 0,
        "longitude": 0,
        "cuisine": "",
        "priceRange": "€€",
        "description": desc,
        "kidFeatures": [],
        "ageRange": "0-12",
        "address": "",
        "website": "",
        "tip": "",
        "sources": [source] if source else [],
        "imageUrl": "",
        "imageAlt": f"{name} in {loc}, Algarve, Portugal"
    }
    new_restaurants.append(entry)

# === BEACHES ===
new_beaches = []
for p in curated.get('beach', []):
    name = p['name']
    loc = p.get('location', '')
    desc = p.get('description_nl', p.get('description', ''))
    source = p.get('_source', '')
    age = p.get('age_info', '')
    
    entry = {
        "name": name,
        "location": loc,
        "latitude": 0,
        "longitude": 0,
        "description": desc,
        "kidFeatures": [],
        "facilities": [],
        "bestSeason": "June–September",
        "ageRange": age if age else "0-12",
        "tip": "",
        "sources": [source] if source else [],
        "imageUrl": "",
        "imageAlt": f"{name} beach in {loc}, Algarve, Portugal"
    }
    new_beaches.append(entry)

# === ACTIVITIES ===
new_activities = []
for p in curated.get('playground_activity', []):
    name = p['name']
    # Clean up the pedagogical farm name
    if 'Pedagogical Farm' in name:
        name = 'Pedagogical Farm (Portugal Farm Experience)'
    loc = p.get('location', '')
    if 'Portugal Farm Experience' in loc:
        loc = 'Silves'
    desc = p.get('description_nl', p.get('description', ''))
    source = p.get('_source', '')
    age = p.get('age_info', '')
    
    # Determine sub-category
    name_lower = name.lower()
    if any(x in name_lower for x in ['speeltuin', 'playground', 'park ', 'parque']):
        cat = 'playground'
    elif any(x in name_lower for x in ['golf', 'kart', 'surf', 'kajak', 'kayak', 'ride', 'bike', 'fietst', 'pickle']):
        cat = 'sport'
    elif any(x in name_lower for x in ['wandel', 'trail', 'walk', 'rota']):
        cat = 'nature_walk'
    elif any(x in name_lower for x in ['boot', 'ship', 'cruise', 'boat']):
        cat = 'boat_tour'
    else:
        cat = 'activity'
    
    entry = {
        "name": name,
        "location": loc,
        "latitude": 0,
        "longitude": 0,
        "category": cat,
        "description": desc,
        "kidFeatures": [],
        "ageRange": age if age else "2-12",
        "cost": "",
        "openingHours": "",
        "tip": "",
        "sources": [source] if source else [],
        "imageUrl": "",
        "imageAlt": f"{name} in {loc}, Algarve, Portugal"
    }
    new_activities.append(entry)

# === ATTRACTIONS ===
new_attractions = []
for p in curated.get('attraction', []):
    name = p['name']
    loc = p.get('location', '')
    desc = p.get('description_nl', p.get('description', ''))
    source = p.get('_source', '')
    age = p.get('age_info', '')
    
    # Determine sub-category
    name_lower = name.lower()
    if any(x in name_lower for x in ['castle', 'kasteel', 'castelo', 'fort', 'muur', 'ruïne', 'kerk', 'igreja', 'capela']):
        cat = 'historic_site'
    elif any(x in name_lower for x in ['zoo', 'dieren', 'animal', 'shelter', 'farm', 'burro', 'ezel']):
        cat = 'animal_park'
    elif any(x in name_lower for x in ['museum', 'museu', 'science', 'ciência']):
        cat = 'museum'
    elif any(x in name_lower for x in ['waterpark', 'aqualand', 'aquashow', 'slide']):
        cat = 'waterpark'
    elif any(x in name_lower for x in ['markt', 'market', 'marina']):
        cat = 'market_marina'
    else:
        cat = 'attraction'
    
    entry = {
        "name": name,
        "location": loc,
        "latitude": 0,
        "longitude": 0,
        "category": cat,
        "description": desc,
        "kidFeatures": [],
        "ageRange": age if age else "0-12",
        "priceAdult": "",
        "priceChild": "",
        "openingHours": "",
        "season": "Year-round",
        "website": "",
        "tip": "",
        "sources": [source] if source else [],
        "imageUrl": "",
        "imageAlt": f"{name} in {loc}, Algarve, Portugal"
    }
    new_attractions.append(entry)

# Merge and write
all_restaurants = existing_restaurants + new_restaurants
all_beaches = existing_beaches + new_beaches
all_activities = existing_activities + new_activities
all_attractions = existing_attractions + new_attractions

with open('research/restaurants.json', 'w', encoding='utf-8') as f:
    json.dump(all_restaurants, f, indent=2, ensure_ascii=False)

with open('research/beaches.json', 'w', encoding='utf-8') as f:
    json.dump(all_beaches, f, indent=2, ensure_ascii=False)

with open('research/playgrounds_activities.json', 'w', encoding='utf-8') as f:
    json.dump(all_activities, f, indent=2, ensure_ascii=False)

with open('research/attractions.json', 'w', encoding='utf-8') as f:
    json.dump(all_attractions, f, indent=2, ensure_ascii=False)

print(f"Restaurants: {len(existing_restaurants)} existing + {len(new_restaurants)} new = {len(all_restaurants)}")
print(f"Beaches: {len(existing_beaches)} existing + {len(new_beaches)} new = {len(all_beaches)}")
print(f"Activities: {len(existing_activities)} existing + {len(new_activities)} new = {len(all_activities)}")
print(f"Attractions: {len(existing_attractions)} existing + {len(new_attractions)} new = {len(all_attractions)}")
print(f"\nTotal: {len(all_restaurants) + len(all_beaches) + len(all_activities) + len(all_attractions)} places")
