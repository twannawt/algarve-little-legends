#!/usr/bin/env python3
"""Translate facilities from English to Dutch."""
import json
import os

FACILITY_MAP = {
    "3 beach bars / restaurants": "3 strandtenten/restaurants",
    "3 restaurants on beach": "3 restaurants aan het strand",
    "SUP and boat tour rentals": "SUP- en boottochtverhuur",
    "beach bar": "strandtent",
    "beach bars and restaurants": "strandtenten en restaurants",
    "beach club with loungers": "strandclub met ligbedden",
    "beach restaurant and bar": "strandrestaurant en bar",
    "boardwalk above beach": "boardwalk boven het strand",
    "boat tours of lagoon": "boottochten over de lagune",
    "boat trip departures": "vertrekpunt boottochten",
    "cafés nearby": "cafés in de buurt",
    "car park": "parkeerplaats",
    "car park at top": "parkeerplaats bovenaan",
    "cliff trail walkway above": "kliffpad erboven",
    "food stalls and umbrella rental at car park": "eetkraampjes en parasolhuur bij de parkeerplaats",
    "free large car park": "grote gratis parkeerplaats",
    "free parking close to beach": "gratis parkeren dichtbij het strand",
    "kayak & pedalo rental": "kajak- en waterfiets verhuur",
    "kayak and SUP hire": "kajak- en SUP-verhuur",
    "kayak and SUP rental": "kajak- en SUP-verhuur",
    "kayak hire": "kajakverhuur",
    "kids' club at resort": "kinderclub bij het resort",
    "large car park at Pedras d'El Rei (€8/day)": "grote parkeerplaats bij Pedras d'El Rei (€8/dag)",
    "large car parks": "grote parkeerplaatsen",
    "long boardwalk with multiple restaurants": "lange boardwalk met meerdere restaurants",
    "multiple beach cafés and restaurants": "meerdere strandcafés en restaurants",
    "multiple car parks along beach": "meerdere parkeerplaatsen langs het strand",
    "multiple large car parks": "meerdere grote parkeerplaatsen",
    "multiple parking areas": "meerdere parkeerplaatsen",
    "multiple restaurants & cafés": "meerdere restaurants en cafés",
    "paid parking (approx. €2) near beach": "betaald parkeren (ca. €2) bij het strand",
    "parking": "parkeren",
    "parking (arrive early — fills fast)": "parkeren (kom vroeg — raakt snel vol)",
    "parking (free 5 min walk or paid nearby)": "parkeren (gratis 5 min lopen of betaald dichtbij)",
    "parking at top of village (walk down) or limited near beach": "parkeren bovenin het dorp (naar beneden lopen) of beperkt bij het strand",
    "parking near bridge": "parkeren bij de brug",
    "parking nearby": "parkeren in de buurt",
    "parking up the hill": "parkeren op de heuvel",
    "pedalo and SUP rental": "waterfiets- en SUP-verhuur",
    "playground": "speeltuin",
    "restaurant & bar": "restaurant en bar",
    "restaurant on beach": "restaurant aan het strand",
    "restaurants & cafés on promenade": "restaurants en cafés aan de boulevard",
    "restaurants (Martinhal resort)": "restaurants (Martinhal resort)",
    "restaurants and beach bar": "restaurants en strandtent",
    "restaurants and beach bars": "restaurants en strandtenten",
    "restaurants at both ends (Vilamoura end has more)": "restaurants aan beide kanten (Vilamoura-kant heeft meer)",
    "restaurants on beach": "restaurants aan het strand",
    "restaurants on beach (try La Cigale for cataplana)": "restaurants aan het strand (probeer La Cigale voor cataplana)",
    "several cafés and small restaurants": "diverse cafés en kleine restaurants",
    "several family restaurants nearby": "diverse gezinsrestaurants in de buurt",
    "shops": "winkels",
    "showers": "douches",
    "small café on beach": "klein café op het strand",
    "small car park at top (gets full early)": "kleine parkeerplaats bovenaan (raakt vroeg vol)",
    "small entertainment (live music, food trucks in peak season)": "klein vermaak (livemuziek, foodtrucks in het hoogseizoen)",
    "small supermarket": "kleine supermarkt",
    "sun lounger and parasol rental": "ligbed- en parasolverhuur",
    "sun lounger and umbrella rental": "ligbed- en parasolverhuur",
    "sun lounger and watersports rental": "ligbed- en watersportverhuur",
    "sun lounger rental": "ligbedverhuur",
    "sunshade hire (€12/day — pre-book in peak season)": "parasolverhuur (€12/dag — boek vooraf in het hoogseizoen)",
    "surf school": "surfschool",
    "toilets": "toiletten",
    "toilets along promenade": "toiletten langs de boulevard",
    "toilets and showers": "toiletten en douches",
    "toilets at beach": "toiletten bij het strand",
    "toilets at each access point": "toiletten bij elk toegangspunt",
    "toilets at several points": "toiletten op meerdere plekken",
    "toilets with changing rooms": "toiletten met kleedruimtes",
    "volleyball & football pitches": "volleybal- en voetbalvelden",
    "water sports hire": "watersportverhuur",
    "windsurfing hire": "windsurfverhuur",
}

research_dir = os.path.join(os.path.dirname(__file__), 'research')
total = 0

for filename in sorted(os.listdir(research_dir)):
    if not filename.endswith('.json'):
        continue
    filepath = os.path.join(research_dir, filename)
    with open(filepath) as f:
        places = json.load(f)
    
    changed = False
    for place in places:
        facs = place.get('facilities', [])
        if not facs:
            continue
        new_facs = []
        for fac in facs:
            if fac in FACILITY_MAP:
                new_facs.append(FACILITY_MAP[fac])
                if FACILITY_MAP[fac] != fac:
                    total += 1
                    changed = True
            else:
                new_facs.append(fac)
        place['facilities'] = new_facs
    
    if changed:
        with open(filepath, 'w') as f:
            json.dump(places, f, ensure_ascii=False, indent=2)
        print(f"{filename}: translated facilities")

print(f"\nTotal facility translations: {total}")
