#!/usr/bin/env python3
"""Second pass: translate remaining English fragments."""
import json
import os
import re

EXTRA_FEATURES = {
    "accessible boardwalk through dunes": "toegankelijke boardwalk door de duinen",
    "baby changing rooms": "babyverschoonruimtes",
    "baby-changing facilities": "babyverschoonfaciliteiten",
    "babysitting+ drop-off option": "oppas en drop-off optie",
    "birthday party rooms": "verjaardagsfeestjesruimtes",
    "calm lagoon waters (no ocean swell)": "rustig lagune water (geen oceaandeining)",
    "calm sheltered water": "rustig beschut water",
    "calm transparent water": "rustig helder water",
    "calm water near shore": "rustig water bij de kust",
    "clear water for paddling": "helder water om in te pootjebaden",
    "fenced waterfront": "omheinde waterkant",
    "interactive cistern museum nearby": "interactief cisterne-museum in de buurt",
    "lagoon beach with shallow water": "lagunestrand met ondiep water",
    "lagoon shallow water play": "ondiep waterspel in de lagune",
    "natural waterfall setting": "natuurlijke watervalomgeving",
    "near AquaShow waterpark": "vlakbij AquaShow waterpark",
    "open courtyard": "open binnenplaats",
    "pram access": "buggy-toegang",
    "reduced ticket ages 3–5": "gereduceerd tarief 3–5 jaar",
    "shallow water at shore": "ondiep water bij de kust",
    "summer water play": "waterspelen in de zomer",
    "very calm sheltered water": "zeer rustig beschut water",
    "water play facilities": "waterspeelfaciliteiten",
    "water slides": "waterglijbanen",
}

EXTRA_SEASON_FIXES = [
    ("closed Christmas Day and New Year's Day", "gesloten op Eerste Kerstdag en Nieuwjaarsdag"),
    ("peak; mini-train runs all summer", "hoogtepunt; minitrein rijdt de hele zomer"),
    ("check calendar; some days/weeks closed in shoulder season", "check de kalender; sommige dagen/weken gesloten in het tussenseizoen"),
    ("outdoor", "buiten"),
    ("indoor", "binnen"),
]

EXTRA_AGE_FIXES = {
    "0+ (free under 6)": "0+ (gratis onder 6 jaar)",
    "0+ (free under 2; reduced 3–5)": "0+ (gratis onder 2 jaar; gereduceerd 3–5 jaar)",
    "0+ (babies free)": "0+ (baby's gratis)",
    "0+ (free under 3)": "0+ (gratis onder 3 jaar)",
    "0+ (free under 1m; best from age 3+)": "0+ (gratis onder 1m; het beste vanaf 3 jaar)",
    "1–11 (adults enter free)": "1–11 (volwassenen gratis)",
    "2+ (best from age 4+; under 6 free)": "2+ (het beste vanaf 4 jaar; onder 6 jaar gratis)",
    "2+ (free under 5 typically; hands-on exhibits from age 4+)": "2+ (meestal gratis onder 5 jaar; doe-tentoonstellingen vanaf 4 jaar)",
    "2+ (free under 15; very hands-on)": "2+ (gratis onder 15 jaar; erg interactief)",
    "2+ (best from age 3+; under 5 with adult)": "2+ (het beste vanaf 3 jaar; onder 5 met een volwassene)",
}

research_dir = os.path.join(os.path.dirname(__file__), 'research')
total_changes = 0

for filename in sorted(os.listdir(research_dir)):
    if not filename.endswith('.json'):
        continue
    filepath = os.path.join(research_dir, filename)
    with open(filepath) as f:
        places = json.load(f)
    
    changes = 0
    for place in places:
        # Fix kidFeatures
        features = place.get('kidFeatures', [])
        new_features = []
        for feat in features:
            if feat in EXTRA_FEATURES:
                new_features.append(EXTRA_FEATURES[feat])
                changes += 1
            else:
                new_features.append(feat)
        place['kidFeatures'] = new_features
        
        # Fix season
        for field in ['bestSeason', 'season']:
            val = place.get(field, '')
            if val:
                new_val = val
                for en, nl in EXTRA_SEASON_FIXES:
                    new_val = new_val.replace(en, nl)
                if new_val != val:
                    place[field] = new_val
                    changes += 1
        
        # Fix ageRange
        val = place.get('ageRange', '')
        if val and val in EXTRA_AGE_FIXES:
            place['ageRange'] = EXTRA_AGE_FIXES[val]
            changes += 1
    
    with open(filepath, 'w') as f:
        json.dump(places, f, ensure_ascii=False, indent=2)
    
    print(f"{filename}: {changes} additional changes")
    total_changes += changes

print(f"\nTotal additional changes: {total_changes}")

# Final verification
print("\n=== Final verification ===")
remaining_en = 0
for filename in sorted(os.listdir(research_dir)):
    if not filename.endswith('.json'):
        continue
    filepath = os.path.join(research_dir, filename)
    with open(filepath) as f:
        places = json.load(f)
    for place in places:
        for feat in place.get('kidFeatures', []):
            low = feat.lower()
            # Very strict check: pure English indicators without Dutch words
            en_only = ['playground', 'children', 'toddler', 'stroller', 'pram', 
                       'shallow', 'changing room', 'baby-friendly', 'kid-friendly',
                       'child-friendly', 'highchair', 'bouncy castle']
            if any(w in low for w in en_only):
                print(f"  STILL EN: {place['name']}: {feat}")
                remaining_en += 1

print(f"\nRemaining clearly English features: {remaining_en}")
