#!/usr/bin/env python3
"""Translate all English text fields in the research JSON files to Dutch."""
import json
import os
import re

# ============================================================
# MONTH TRANSLATIONS
# ============================================================
MONTH_EN_TO_NL = {
    "January": "januari", "February": "februari", "March": "maart",
    "April": "april", "May": "mei", "June": "juni",
    "July": "juli", "August": "augustus", "September": "september",
    "October": "oktober", "November": "november", "December": "december",
    "Jan": "jan", "Feb": "feb", "Mar": "mrt", "Apr": "apr",
    "Jun": "jun", "Jul": "jul", "Aug": "aug", "Sep": "sep",
    "Oct": "okt", "Nov": "nov", "Dec": "dec",
}

# ============================================================
# kidFeatures TRANSLATION MAP
# ============================================================
FEATURE_TRANSLATIONS = {
    # --- Beach features ---
    "calm sheltered bay": "rustige beschutte baai",
    "no steps from town to sand": "geen trappen vanuit het dorp naar het strand",
    "lifeguards in season": "strandwachten in het seizoen",
    "wave-free calm water behind breakwater": "golfloos rustig water achter de golfbreker",
    "playground on the beach": "speeltuin op het strand",
    "flat sandy entry": "vlakke zandige ingang",
    "calm clear water in sheltered cove": "rustig helder water in beschutte inham",
    "rock formations & small sea caves to explore": "rotsformaties & kleine grotten om te verkennen",
    "dramatic scenery keeps children engaged": "spectaculair uitzicht houdt kinderen geboeid",
    "calm water": "rustig water",
    "wide sandy beach": "breed zandstrand",
    "sea cave at beach end to explore": "zeegrot aan het einde van het strand om te verkennen",
    "calm sheltered cove": "rustige beschutte inham",
    "stroller accessible to top of path": "buggy-toegankelijk tot bovenaan het pad",
    "good starting point for boat cave tours": "goed startpunt voor boot-grottochten",
    "wide golden beach": "breed gouden strand",
    "gentle entry into sea": "geleidelijke ingang in de zee",
    "rock pools and caves nearby": "rotspoelen en grotten in de buurt",
    "huge space — never overcrowded": "enorm veel ruimte — nooit overvol",
    "flat easy access": "vlakke, makkelijke toegang",
    "stroller friendly": "buggy-vriendelijk",
    "stroller-friendly": "buggy-vriendelijk",
    "very gentle slope into water — ideal for toddlers": "zeer geleidelijke helling het water in — ideaal voor peuters",
    "calm bay": "rustige baai",
    "accessible waterfront promenade for strollers": "toegankelijke boulevard voor buggy's",
    "wide flat sandy beach": "breed vlak zandstrand",
    "rock pools at low tide": "rotspoelen bij eb",
    "sheltered by offshore islands — calmer than most west-Algarve beaches": "beschut door eilanden — rustiger dan de meeste West-Algarve stranden",
    "shallow water near shore": "ondiep water bij de kust",
    "sheltered by cliffs — reduced wind": "beschut door kliffen — minder wind",
    "local families preferred beach": "favoriet strand van lokale gezinnen",
    "enormous width — never fully packed": "enorme breedte — nooit helemaal vol",
    "flat shoreline": "vlakke kustlijn",
    "huge beach with plenty of space": "groot strand met veel ruimte",
    "authentic village atmosphere": "authentieke dorpssfeer",
    "stroller-friendly boardwalk into village": "buggy-vriendelijke promenade naar het dorp",
    "excellent rock pools between beach sections": "uitstekende rotspoelen tussen strandgedeelten",
    "sheltered quieter beach section among rocks": "beschut, rustiger strandgedeelte tussen de rotsen",
    "village atmosphere with restaurants at water level": "dorpssfeer met restaurants aan het water",
    "miniature train ride (free under 4)": "rit met de minitrein (gratis onder 4 jaar)",
    "very calm sea — faces SE away from Atlantic swell": "zeer rustige zee — gericht op ZO, uit de Atlantische deining",
    "shallow warm water": "ondiep warm water",
    "calm shallow water with gradual slope": "rustig ondiep water met geleidelijke helling",
    "no sudden depth changes": "geen plotselinge diepteveranderingen",
    "scenic wooden bridge walk to reach beach": "schilderachtige houten brug naar het strand",
    "very shallow calm water — deepens slowly": "zeer ondiep rustig water — wordt langzaam dieper",
    "warmer water than western Algarve": "warmer water dan de westelijke Algarve",
    "anchor cemetery curiosity for children": "ankerkerkhof als curiositeit voor kinderen",
    "wide beach with dune shelter": "breed strand met duinbescherming",
    "calm sea on east-facing coast": "rustige zee aan de oostkust",
    "playground nearby": "speeltuin in de buurt",
    "sheltered from prevailing winds": "beschut tegen overheersende wind",
    "fisherman village atmosphere": "visserssfeer",
    "promenade along cliff top": "promenade langs de klifrand",
    "small beach — easy to keep children in sight": "klein strand — kinderen makkelijk in het oog te houden",
    "rock pool exploring at low tide": "rotspoelen verkennen bij eb",
    "easy boardwalk access": "makkelijke toegang via boardwalk",
    "flat entry into water": "vlakke ingang in het water",
    "sheltered lagoon swimming possible": "zwemmen in beschutte lagune mogelijk",
    "wide open beach": "wijd open strand",
    "gentle waves": "zachte golven",
    "beach bars with shade": "strandtenten met schaduw",

    # --- Playground features ---
    "new equipment": "nieuwe speeltoestellen",
    "near beach": "bij het strand",
    "sea views": "zeezicht",
    "shaded by trees": "schaduw van bomen",
    "separate toddler area": "apart peutergedeelte",
    "in town center": "in het centrum",
    "fenced area": "omheind terrein",
    "large grassy area": "groot grasveld",
    "rubber surface": "rubberen ondergrond",
    "safe surface": "veilige ondergrond",
    "near cafes": "vlakbij cafés",
    "riverside setting": "aan de rivier",
    "soft ground": "zachte grond",
    "climbing frames": "klimrekken",
    "slides": "glijbanen",
    "swings": "schommels",
    "shaded": "beschaduwd",
    "benches for parents": "bankjes voor ouders",
    "near parking": "vlakbij parkeren",
    "flat terrain": "vlak terrein",
    "modern play equipment": "modern speeltoestellen",
    "shaded picnic tables": "picknicktafels in de schaduw",
    "near toilets": "vlakbij toiletten",
    "free entry": "gratis toegang",
    "clean facilities": "schone voorzieningen",
    "spacious": "ruim",
    "quiet area": "rustige omgeving",
    "safe enclosed area": "veilig omheind terrein",
    "bike paths nearby": "fietspaden in de buurt",
    "nature surroundings": "natuurlijke omgeving",
    "parking available": "parkeren beschikbaar",

    # --- Waterpark / attraction features ---
    "toddler area (Tropical Paradise)": "peutergedeelte (Tropical Paradise)",
    "children's slides": "kinderglijbanen",
    "foam slides": "schuimglijbanen",
    "shallow lagoon pool": "ondiep laguneswembad",
    "family slides": "familieglijbanen",
    "free for babies <1m": "gratis voor baby's <1m",
    "toddler pool": "peuterbad",
    "wave pool": "golfslagbad",
    "lazy river": "wildwaterbaan",
    "kiddie area": "kinderarea",
    "indoor pool option": "optie voor binnenbad",
    "water slides for all ages": "waterglijbanen voor alle leeftijden",
    "splash area": "waterpleziergebied",
    "mini golf": "minigolf",
    "18-hole mini golf": "18-holes minigolf",
    "bouncy castle": "springkussen",
    "go-karts": "skelters",
    "trampolines": "trampolines",
    "mini farm": "miniboerderij",
    "petting zoo": "kinderboerderij",
    "animal feeding": "dieren voeren",
    "pony rides": "ponyrijden",
    "educational programs": "educatieve programma's",
    "face painting": "schminken",
    "craft activities": "knutselactiviteiten",
    "birthday parties": "verjaardagsfeestjes",
    "indoor play area": "binnenspeeltuin",
    "soft play": "softplay",
    "air-conditioned": "airconditioning",
    "baby changing facilities": "babyverschoonfaciliteiten",
    "highchairs available": "kinderstoelen beschikbaar",
    "parking": "parkeren",
    "family-friendly": "gezinsvriendelijk",
    "stroller access": "buggy-toegang",
    "wheelchair accessible": "rolstoeltoegankelijk",
    "cafe on site": "café aanwezig",
    "restaurant on site": "restaurant aanwezig",
    "picnic area": "picknickgebied",
    "shaded areas": "schaduwplekken",
    "sunscreen stations": "zonnebrandstations",
    "first aid": "EHBO",
    "lockers available": "lockers beschikbaar",
    "gift shop": "cadeauwinkel",
    "photo opportunities": "fotomogelijkheden",

    # --- Activity features ---
    "suitable for toddlers": "geschikt voor peuters",
    "suitable for all ages": "geschikt voor alle leeftijden",
    "life jackets provided": "zwemvesten beschikbaar",
    "child-friendly guides": "kindvriendelijke gidsen",
    "educational": "educatief",
    "interactive exhibits": "interactieve tentoonstellingen",
    "hands-on activities": "doe-activiteiten",
    "outdoor playground": "buitenspeeltuin",
    "indoor activities": "binnenactiviteiten",
    "rainy day option": "optie voor regenachtige dag",
    "guided tours available": "rondleidingen beschikbaar",
    "audio guide available": "audiogids beschikbaar",
    "child-friendly menu": "kindermenu beschikbaar",
    "kids eat free": "kinderen eten gratis",
    "family discount": "gezinskorting",
    "online booking available": "online boeken mogelijk",
    "advance booking recommended": "vooraf boeken aanbevolen",

    # --- Restaurant features ---
    "kids menu": "kindermenu",
    "high chairs": "kinderstoelen",
    "highchairs": "kinderstoelen",
    "outdoor terrace": "buitenterras",
    "play area": "speelhoek",
    "baby-friendly": "babyvriendelijk",
    "changing room": "verschoonruimte",
    "child-sized portions": "kinderporties",
    "crayons and coloring": "kleurpotloden en kleurplaten",
    "quiet area for families": "rustige plek voor gezinnen",
    "family seating": "gezinszitplaatsen",
    "spacious terrace": "ruim terras",
    "ocean view": "zeezicht",
    "garden seating": "tuinterras",
    "affordable": "betaalbaar",
    "child portions available": "kinderporties beschikbaar",
    "stroller space": "ruimte voor buggy's",
    "kids corner": "kinderhoek",

    # --- Animal / nature features ---
    "animal shows": "dierenshows",
    "dolphin show": "dolfijnenshow",
    "bird of prey show": "roofvogelshow",
    "seal show": "zeehondenshow",
    "reptile house": "reptielenhuis",
    "aquarium": "aquarium",
    "touch pool": "aanraakbad",
    "butterfly garden": "vlindertuin",
    "nature trails": "natuurpaden",
    "bird watching": "vogels kijken",
    "nature walks": "natuurwandelingen",
    "scenic views": "schilderachtig uitzicht",
    "easy walking trails": "makkelijke wandelpaden",
    "flat paths for strollers": "vlakke paden voor buggy's",
    "picnic spots": "picknickplekken",
    "shaded walking paths": "wandelpaden in de schaduw",
    "animals (peacocks, ducks, turtles)": "dieren (pauwen, eenden, schildpadden)",
    "feeding times marked": "voedertijden aangegeven",
    
    # --- Cultural / indoor features ---
    "interactive displays": "interactieve displays",
    "child-friendly explanations": "kindvriendelijke uitleg",
    "coloring activities": "kleuractiviteiten",
    "air conditioning": "airconditioning",
    "free wifi": "gratis wifi",
    "baby area": "babyruimte",
    "good for rainy days": "goed voor regenachtige dagen",
    "free admission": "gratis entree",
    "wheelchair friendly": "rolstoelvriendelijk",

    # --- Sport features ---
    "Robokeeper": "Robokeeper",
    "4D cinema": "4D-bioscoop",
    "VR zone": "VR-zone",
    "Toy Zone": "Speelgoedzone",
    "7 lanes": "7 banen",
    "arcade games": "arcadespellen",
    "Mini F1 track (age 3–6)": "Mini F1-baan (3–6 jaar)",
    "Junior Circuit (age 7–12)": "Junior Circuit (7–12 jaar)",
    "Adventure Island (up to 10 years)": "Avontureneiland (tot 10 jaar)",
    "Adventure Island (up to 10 yrs)": "Avontureneiland (tot 10 jaar)",
    "Pony Club (Saturdays)": "Ponyclub (zaterdags)",
    "Roman theme": "Romeins thema",
    "Roman/adventure theme": "Romeins/avonturenthema",
    "15% online discount": "15% online korting",
    "1.5 hours duration": "1,5 uur duur",
    "10,000m² of gardens": "10.000m² aan tuinen",

    # --- Ria Formosa ---
    "Ria Formosa exhibits": "Ria Formosa-tentoonstellingen",
    "Ria Formosa nature (flamingos, birds)": "Ria Formosa-natuur (flamingo's, vogels)",
    "Blue Flag beach": "Blauwe Vlag-strand",
    
    # --- Generic ---
    "free": "gratis",
    "toilets": "toiletten",
    "shade": "schaduw",
    "quiet": "rustig",
    "safe": "veilig",
    "clean": "schoon",
    "large": "groot",
    "small": "klein",

    # --- Batch 2: remaining untranslated ---
    "all-you-can-eat buffet (easy for picky eaters)": "all-you-can-eat buffet (makkelijk voor kieskeurige eters)",
    "bar and snacks": "bar en snacks",
    "beach access": "strandtoegang",
    "beach and lagoon access": "strand- en lagunetoegang",
    "beach location": "locatie aan het strand",
    "beach strip location": "locatie aan de strandstrook",
    "beachfront route": "route langs het strand",
    "beachside location": "locatie aan het strand",
    "beautiful garden setting": "mooie tuinomgeving",
    "bike hire available nearby": "fietsverhuur in de buurt",
    "bouncy castles (outdoor)": "springkussens (buiten)",
    "bumpers available": "bumpers beschikbaar",
    "buttons and levers children can touch": "knoppen en hendels die kinderen kunnen aanraken",
    "calm and well-trained horses": "rustige en goed getrainde paarden",
    "calm lagoon boat": "rustige lagune-boot",
    "car-accessible parking": "goed bereikbare parkeerplaats",
    "car-free marina plaza": "autovrij marinaplein",
    "car-free pedestrian square": "autovrij voetgangersplein",
    "child prices available": "kinderprijzen beschikbaar",
    "child tickets available": "kinderkaartjes beschikbaar",
    "child-focused resort facilities nearby": "kindgerichte resortfaciliteiten in de buurt",
    "clean surfaces": "schone ondergronden",
    "cliff shade available": "schaduw van kliffen beschikbaar",
    "climbing area": "klimgedeelte",
    "connects two family-friendly towns": "verbindt twee gezinsvriendelijke dorpen",
    "dedicated children's zone": "speciale kinderzone",
    "dedicated soft-play room with glass wall": "speciale softplay-ruimte met glazen wand",
    "dedicated toddler zone": "speciaal peutergedeelte",
    "directly above beach": "direct boven het strand",
    "directly beside beach": "direct naast het strand",
    "dogs not allowed (safe for kids)": "geen honden toegestaan (veilig voor kinderen)",
    "dress-up area": "verkleedhoek",
    "dressing-up box for kids": "verkleedkist voor kinderen",
    "easy beach access for kids": "makkelijke strandtoegang voor kinderen",
    "easy boarding": "makkelijk instappen",
    "easy flat walk": "makkelijke vlakke wandeling",
    "easy walking trails from Faro": "makkelijke wandelpaden vanuit Faro",
    "excellent for sandcastles": "uitstekend voor zandkastelen",
    "family rides": "gezinsattracties",
    "family shows": "gezinsshows",
    "family ticket available": "gezinskaartje beschikbaar",
    "family-favourite for 10+ years": "gezinsfavoriet al 10+ jaar",
    "family-owned by parents": "familiebedrijf van ouders",
    "farm setting with animals/plants": "boerderijomgeving met dieren en planten",
    "fenced playground in sand nearby": "omheinde speeltuin in het zand in de buurt",
    "fitness area": "fitnessruimte",
    "flat and safe": "vlak en veilig",
    "flat and traffic-free": "vlak en autovrij",
    "flat route": "vlakke route",
    "flat sandy beach": "vlak zandstrand",
    "flat with railings": "vlak met leuningen",
    "food and drinks available": "eten en drinken beschikbaar",
    "free entry under 6": "gratis entree onder 6 jaar",
    "free park entry": "gratis toegang tot het park",
    "free parking": "gratis parkeren",
    "free parking nearby": "gratis parkeren in de buurt",
    "free to visit": "gratis te bezoeken",
    "free under 15": "gratis onder 15 jaar",
    "free under 1m": "gratis onder 1m",
    "free under 2": "gratis onder 2 jaar",
    "free under 3": "gratis onder 3 jaar",
    "free under 6": "gratis onder 6 jaar",
    "fully fenced play zone": "volledig omheinde speelzone",
    "fully stroller-accessible": "volledig buggy-toegankelijk",
    "games sofa area": "spelletjeshoek met banken",
    "garden setting": "tuinomgeving",
    "gardens to run in": "tuinen om in te rennen",
    "gentle hacks for all levels": "rustige buitenritten voor alle niveaus",
    "giant soft play": "groot softplay-gedeelte",
    "good for snorkelling": "goed om te snorkelen",
    "half-portions available": "halve porties beschikbaar",
    "high chairs available": "kinderstoelen beschikbaar",
    "huge inflatable trampolines": "grote opblaastrampolines",
    "indoor area for bad weather": "binnenruimte bij slecht weer",
    "indoor outdoor amusements outside": "binnen- en buitenvermaak",
    "indoor pools": "binnenzwembaden",
    "indoor/outdoor": "binnen/buiten",
    "island beach stops": "stops bij eilandstrandjes",
    "kid-friendly Italian menu": "kindvriendelijk Italiaans menu",
    "kids can play in sand": "kinderen kunnen in het zand spelen",
    "kids can play on beach": "kinderen kunnen op het strand spelen",
    "kids can roam freely": "kinderen kunnen vrij rondlopen",
    "kids can self-entertain": "kinderen kunnen zichzelf vermaken",
    "kids favourite pizza and pasta menu": "favoriet pizza- en pastamenu voor kinderen",
    "kids menu items": "kindermenu beschikbaar",
    "kids menu options": "kindermenu-opties",
    "kids play on sand while parents eat": "kinderen spelen in het zand terwijl ouders eten",
    "kids-friendly welcoming staff": "kindvriendelijk en gastvrij personeel",
    "large drinks available": "grote drankjes beschikbaar",
    "large garden for free play": "grote tuin om vrij te spelen",
    "large outdoor play space": "grote buitenspeelruimte",
    "large slides": "grote glijbanen",
    "largest play area in Albufeira": "grootste speeltuin in Albufeira",
    "leads to a wide sandy beach": "leidt naar een breed zandstrand",
    "leads to beach": "leidt naar het strand",
    "less crowded than Albufeira town beaches": "minder druk dan de stadsstranden van Albufeira",
    "life jackets for all ages": "zwemvesten voor alle leeftijden",
    "lots of small dishes kids can try": "veel kleine gerechten die kinderen kunnen proberen",
    "major kids film releases": "grote kinderfilms",
    "manageable size for toddlers": "overzichtelijk formaat voor peuters",
    "milkshakes and kid-friendly food": "milkshakes en kindvriendelijk eten",
    "misting system for summer heat": "vernevelsysteem tegen de zomerhitte",
    "modern facilities": "moderne faciliteiten",
    "multi-level play structure": "speeltoestel met meerdere niveaus",
    "multiple equipment sets for different ages": "meerdere speeltoestellen voor verschillende leeftijden",
    "multiple play facilities": "meerdere speelfaciliteiten",
    "open sand play area": "open zandspeelruimte",
    "open space for kids to roam": "open ruimte voor kinderen om te spelen",
    "open-air cinema for kids": "openluchtbioscoop voor kinderen",
    "organic child-friendly food": "biologisch kindvriendelijk eten",
    "outdoor area": "buitenruimte",
    "outdoor bouncy castles": "springkussens buiten",
    "outdoor garden setting": "buitentuinomgeving",
    "outdoor playground (free)": "buitenspeeltuin (gratis)",
    "outdoor seating available": "buitenzitplaatsen beschikbaar",
    "outdoor terrace seating": "zitplaatsen op het buitenterras",
    "outdoors in orange groves": "buiten tussen de sinaasappelbomen",
    "pancakes with Nutella for kids": "pannenkoeken met Nutella voor kinderen",
    "penguin area": "pinguïngedeelte",
    "picnic areas": "picknickplekken",
    "pizza and pasta for picky eaters": "pizza en pasta voor kieskeurige eters",
    "pizza and pasta kids love": "pizza en pasta waar kinderen van houden",
    "pizza kids love": "pizza waar kinderen van houden",
    "playground": "speeltuin",
    "playground adjacent to restaurant": "speeltuin naast het restaurant",
    "pony rides for young children": "ponyrijden voor jonge kinderen",
    "pool (seasonal)": "zwembad (seizoensgebonden)",
    "pool tables": "pooltafels",
    "restaurant for parents": "restaurant voor ouders",
    "rock formations and small coves to explore": "rotsformaties en kleine inhammen om te verkennen",
    "rock pools at Praia do Alemão (10 min walk west)": "rotspoelen bij Praia do Alemão (10 min lopen naar het westen)",
    "rock shade available": "schaduw van rotsen beschikbaar",
    "role-play village with buildings": "rollenspeldorp met gebouwen",
    "rural garden setting": "landelijke tuinomgeving",
    "safe area for toddlers to walk": "veilig gedeelte voor peuters om te lopen",
    "safe surfaces": "veilige ondergronden",
    "sandy play area": "zandspeelruimte",
    "scenic coastline and caves": "schilderachtige kustlijn en grotten",
    "shallow entry": "ondiepe ingang",
    "sheltered cove": "beschutte inham",
    "shopping centre location (easy parking)": "winkelcentrumlocatie (makkelijk parkeren)",
    "simple grilled fish kids enjoy": "simpele gegrilde vis waar kinderen van genieten",
    "skatepark": "skatepark",
    "slides (min height 1.20m)": "glijbanen (min. lengte 1,20m)",
    "small boats": "kleine bootjes",
    "small class sizes": "kleine groepen",
    "small clubs for kids": "kleine clubs voor kinderen",
    "small group (max 10)": "kleine groep (max 10)",
    "small group tours": "rondleidingen in kleine groepen",
    "small intimate screens": "kleine, intieme zalen",
    "spa/pool on site": "spa/zwembad aanwezig",
    "splash pool": "spatbad",
    "steps from beach": "op loopafstand van het strand",
    "stroller accessible": "buggy-toegankelijk",
    "stroller accessible terrace": "buggy-toegankelijk terras",
    "stroller-accessible paved path from hotels": "buggy-toegankelijk verhard pad vanuit hotels",
    "stroller-accessible sections": "buggy-toegankelijke gedeelten",
    "stroller-friendly river path": "buggy-vriendelijk rivierpad",
    "stroller-navigable village streets": "buggy-vriendelijke dorpsstraten",
    "strollers welcome": "buggy's welkom",
    "suitable for bike trailers/seats": "geschikt voor fietskarren/-stoeltjes",
    "suitable for trailers/seats": "geschikt voor karren/stoeltjes",
    "suitable for young beginners": "geschikt voor jonge beginners",
    "supervised outdoor playground": "buitenspeeltuin met toezicht",
    "terrace seating": "terrasplaatsen",
    "terraced garden for running around": "terrastuin om in rond te rennen",
    "toddler-friendly areas": "peutervriendelijke gedeelten",
    "toddler-friendly operators available": "peutervriendelijke aanbieders beschikbaar",
    "traditional Portuguese food kids can try": "traditioneel Portugees eten dat kinderen kunnen proberen",
    "traditional music and dance": "traditionele muziek en dans",
    "tropical garden": "tropische tuin",
    "two playgrounds": "twee speeltuinen",
    "under-5s free with adult": "onder 5 jaar gratis met een volwassene",
    "very clean": "zeer schoon",
    "welcoming family atmosphere": "gastvrije gezinssfeer",
    "welcoming family staff": "gastvrij en gezinsvriendelijk personeel",
    "wide open terrace": "groot open terras",
}

# ============================================================
# ageRange TRANSLATIONS
# ============================================================
AGE_TRANSLATIONS = {
    "All ages": "Alle leeftijden",
    "All ages (check with operator for infants)": "Alle leeftijden (check bij de organisator voor baby's)",
    "All ages (toddlers welcome on calm lagoon tours)": "Alle leeftijden (peuters welkom op rustige lagunetochten)",
    "All ages (pushchair-friendly on riverside path)": "Alle leeftijden (buggy-vriendelijk op het rivierpad)",
    "0+ (toddler area for 2-year-olds)": "0+ (peutergedeelte voor 2-jarigen)",
    "1+ (2-year-olds can feed animals and use bouncy castle)": "1+ (2-jarigen kunnen dieren voeren en op het springkussen)",
    "1+ (very toddler-friendly)": "1+ (zeer peutervriendelijk)",
    "2+ (2-year-olds can walk the courtyard; stairs to walls may need assistance)": "2+ (2-jarigen kunnen over de binnenplaats; trappen naar de muren vragen hulp)",
    "2+ (calm boats suitable for toddlers; best from 4+ for guided tours)": "2+ (rustige boten geschikt voor peuters; het beste vanaf 4+ voor rondleidingen)",
    "2+ (pony rides for toddlers; hacks from around age 5+)": "2+ (ponyrijden voor peuters; buitenritten vanaf ca. 5 jaar)",
    "3+ (2-year-olds can participate with parental help)": "3+ (2-jarigen kunnen meedoen met hulp van ouders)",
}

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def translate_months(text):
    """Replace English month names with Dutch equivalents."""
    if not text:
        return text
    result = text
    # Sort by length (longest first) to avoid partial replacements
    for en, nl in sorted(MONTH_EN_TO_NL.items(), key=lambda x: -len(x[0])):
        result = result.replace(en, nl)
    return result

def translate_feature(feature):
    """Translate a single kidFeature string."""
    # Exact match first
    if feature in FEATURE_TRANSLATIONS:
        return FEATURE_TRANSLATIONS[feature]
    
    # Case-insensitive match
    lower = feature.lower()
    for en, nl in FEATURE_TRANSLATIONS.items():
        if en.lower() == lower:
            return nl
    
    # If it contains months, translate those
    translated = translate_months(feature)
    if translated != feature:
        return translated
    
    # Common English words → Dutch replacements for partial matching
    word_replacements = [
        ("playground", "speeltuin"),
        ("children", "kinderen"),
        ("toddler", "peuter"),
        ("baby", "baby"),
        ("family", "gezins"),
        ("kid-friendly", "kindvriendelijk"),
        ("child-friendly", "kindvriendelijk"),
        ("kid friendly", "kindvriendelijk"),
        ("child friendly", "kindvriendelijk"),
        ("stroller", "buggy"),
        ("pushchair", "buggy"),
        ("high chair", "kinderstoel"),
        ("highchair", "kinderstoel"),
        ("swimming pool", "zwembad"),
        ("pool", "zwembad"),
        ("slide", "glijbaan"),
        ("swing", "schommel"),
        ("climbing frame", "klimrek"),
        ("sandbox", "zandbak"),
        ("sandpit", "zandbak"),
        ("trampoline", "trampoline"),
        ("bounce", "spring"),
        ("indoor", "binnen"),
        ("outdoor", "buiten"),
        ("terrace", "terras"),
        ("garden", "tuin"),
        ("parking", "parkeren"),
        ("toilet", "toilet"),
        ("changing", "verschoon"),
        ("shade", "schaduw"),
        ("shaded", "beschaduwd"),
        ("quiet", "rustig"),
        ("calm", "rustig"),
        ("shallow", "ondiep"),
        ("deep", "diep"),
        ("warm", "warm"),
        ("safe", "veilig"),
        ("clean", "schoon"),
        ("free", "gratis"),
        ("beach", "strand"),
        ("sea", "zee"),
        ("ocean", "oceaan"),
        ("river", "rivier"),
        ("lake", "meer"),
        ("nature", "natuur"),
        ("animals", "dieren"),
        ("birds", "vogels"),
        ("fish", "vissen"),
        ("rocks", "rotsen"),
        ("cave", "grot"),
        ("dune", "duin"),
        ("cliff", "klif"),
        ("path", "pad"),
        ("trail", "pad"),
        ("walk", "wandeling"),
        ("view", "uitzicht"),
        ("restaurant", "restaurant"),
        ("cafe", "café"),
        ("snack bar", "snackbar"),
        ("ice cream", "ijsje"),
        ("picnic", "picknick"),
    ]
    
    # Return original if no match - we'll catch these manually
    return feature

def translate_season(text):
    """Translate season/bestSeason text."""
    if not text:
        return text
    
    result = text
    
    # Translate months
    result = translate_months(result)
    
    # Common English phrases in season text
    phrases = [
        ("arrive before", "kom voor"),
        ("beach disappears at high tide", "strand verdwijnt bij vloed"),
        ("lifeguards", "strandwachten"),
        ("water calmer in", "water rustiger in"),
        ("best in summer", "het beste in de zomer"),
        ("best in winter", "het beste in de winter"),
        ("year-round", "het hele jaar"),
        ("Year-round", "Het hele jaar"),
        ("year round", "het hele jaar"),
        ("all year", "het hele jaar"),
        ("All year", "Het hele jaar"),
        ("reopens", "heropent"),
        ("opens", "opent"),
        ("closed in winter", "gesloten in de winter"),
        ("summer only", "alleen in de zomer"),
        ("weekends only", "alleen in het weekend"),
        ("daily", "dagelijks"),
        ("except", "behalve"),
        ("Monday", "maandag"),
        ("Tuesday", "dinsdag"),
        ("Wednesday", "woensdag"),
        ("Thursday", "donderdag"),
        ("Friday", "vrijdag"),
        ("Saturday", "zaterdag"),
        ("Sunday", "zondag"),
    ]
    
    for en, nl in phrases:
        result = result.replace(en, nl)
    
    return result

def translate_age_range(text):
    """Translate ageRange text."""
    if not text:
        return text
    
    # Exact match first
    if text in AGE_TRANSLATIONS:
        return AGE_TRANSLATIONS[text]
    
    # Check for partial matches
    result = text
    partial = [
        ("All ages", "Alle leeftijden"),
        ("all ages", "alle leeftijden"),
        ("toddler area for", "peutergedeelte voor"),
        ("toddler-friendly", "peutervriendelijk"),
        ("toddler friendly", "peutervriendelijk"),
        ("year-olds", "-jarigen"),
        ("year-old", "-jarige"),
        ("years old", "jaar oud"),
        ("can feed animals", "kunnen dieren voeren"),
        ("bouncy castle", "springkussen"),
        ("pony rides for toddlers", "ponyrijden voor peuters"),
        ("can participate with parental help", "kunnen meedoen met hulp van ouders"),
        ("very toddler-friendly", "zeer peutervriendelijk"),
        ("check with operator for infants", "check bij de organisator voor baby's"),
        ("pushchair-friendly", "buggy-vriendelijk"),
        ("suitable for", "geschikt voor"),
    ]
    
    for en, nl in partial:
        result = result.replace(en, nl)
    
    return result

def translate_price(text):
    """Translate English words in price fields."""
    if not text:
        return text
    
    result = text
    replacements = [
        ("free", "gratis"),
        ("Free", "Gratis"),
        ("FREE", "GRATIS"),
        ("(gate)", "(kassa)"),
        ("(online early bird)", "(online vroegboekkorting)"),
        ("(online)", "(online)"),
        ("adults", "volwassenen"),
        ("adult", "volwassene"),
        ("children", "kinderen"),
        ("child", "kind"),
        ("per person", "per persoon"),
        ("per hour", "per uur"),
        ("per day", "per dag"),
        ("per session", "per sessie"),
        ("under", "onder"),
        ("over", "boven"),
        ("from", "vanaf"),
        ("up to", "tot"),
        ("approx", "ca."),
        ("approximately", "ongeveer"),
        ("included", "inbegrepen"),
        ("extra", "extra"),
        ("discount", "korting"),
    ]
    
    for en, nl in replacements:
        result = result.replace(en, nl)
    
    return result

def translate_tip(text):
    """Translate parentTip if it contains English."""
    if not text:
        return text
    
    # Check if the tip is already in Dutch (most are)
    dutch_indicators = ['van ', 'met ', 'voor ', 'een ', 'het ', 'de ', 'dit ', 'Kom ', 'Neem ', 'Boek ', 'Koop ']
    english_indicators = ['the ', 'with ', 'and ', 'for ', 'this ', 'Arrive ', 'Bring ', 'Book ', 'Buy ', 'The ']
    
    nl_score = sum(1 for w in dutch_indicators if w in text)
    en_score = sum(1 for w in english_indicators if w in text)
    
    if nl_score >= en_score:
        return text  # Already Dutch
    
    # For English tips, do basic translations
    result = text
    result = translate_months(result)
    
    return result


def clean_markdown_links(text):
    """Remove markdown link syntax, keeping just the text."""
    if not text:
        return text
    # [text](url) -> text
    return re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)


# ============================================================
# MAIN PROCESSING
# ============================================================

def process_file(filepath):
    """Process a single research JSON file."""
    with open(filepath) as f:
        places = json.load(f)
    
    changed = 0
    for place in places:
        # Clean markdown links in any text field
        for field in ['description', 'ageRange', 'tip']:
            val = place.get(field, '')
            if val and '[' in val and '](' in val:
                cleaned = clean_markdown_links(val)
                if cleaned != val:
                    place[field] = cleaned
                    changed += 1
        
        # Translate kidFeatures
        features = place.get('kidFeatures', [])
        if features:
            new_features = [translate_feature(f) for f in features]
            if new_features != features:
                place['kidFeatures'] = new_features
                changed += 1
        
        # Translate bestSeason / season
        for field in ['bestSeason', 'season']:
            val = place.get(field, '')
            if val:
                translated = translate_season(val)
                if translated != val:
                    place[field] = translated
                    changed += 1
        
        # Translate ageRange
        val = place.get('ageRange', '')
        if val:
            translated = translate_age_range(val)
            if translated != val:
                place['ageRange'] = translated
                changed += 1
        
        # Translate price fields
        for field in ['priceRange', 'priceChildren', 'priceAdult', 'priceChild', 'cost']:
            val = place.get(field, '')
            if val and isinstance(val, str):
                translated = translate_price(val)
                if translated != val:
                    place[field] = translated
                    changed += 1
        
        # Translate parentTip / tip
        for field in ['parentTip', 'tip']:
            val = place.get(field, '')
            if val:
                translated = translate_tip(val)
                if translated != val:
                    place[field] = translated
                    changed += 1
    
    # Write back
    with open(filepath, 'w') as f:
        json.dump(places, f, ensure_ascii=False, indent=2)
    
    return changed, len(places)


def find_untranslated_features(filepath):
    """Find kidFeatures that weren't translated (still in English)."""
    with open(filepath) as f:
        places = json.load(f)
    
    untranslated = []
    for place in places:
        for feat in place.get('kidFeatures', []):
            # Check if feature looks English
            lower = feat.lower()
            english_words = ['the ', 'with ', 'for ', 'and ', 'near ', 'free ', 'safe ', 'easy ',
                           'play', 'child', 'kid', 'family', 'baby', 'toddler', 'stroller',
                           'available', 'friendly', 'area', 'pool', 'slide', 'swing',
                           'indoor', 'outdoor', 'terrace', 'garden', 'park', 'beach',
                           'calm', 'shallow', 'warm', 'gentle', 'sheltered', 'quiet',
                           'large', 'small', 'wide', 'flat', 'clean', 'modern', 'new']
            if any(w in lower for w in english_words):
                # But not if it has Dutch words
                dutch_words = ['speeltuin', 'kinderen', 'geschikt', 'veilig', 'ruimte', 'strand',
                             'zwembad', 'glijbaan', 'schommel', 'rustig', 'ondiep', 'beschut',
                             'peuter', 'baby', 'buggy', 'gratis', 'groot', 'vlak', 'breed',
                             'kinderstoel', 'terras', 'parkeren', 'toilet', 'schaduw',
                             'dieren', 'natuur', 'water', 'zee', 'inham', 'baai']
                if not any(w in lower for w in dutch_words):
                    untranslated.append((place['name'], feat))
    
    return untranslated


# Process all files
research_dir = os.path.join(os.path.dirname(__file__), 'research')
total_changes = 0
total_places = 0

for filename in sorted(os.listdir(research_dir)):
    if filename.endswith('.json'):
        filepath = os.path.join(research_dir, filename)
        changes, count = process_file(filepath)
        total_changes += changes
        total_places += count
        print(f"{filename}: {count} places, {changes} changes")

print(f"\nTotal: {total_places} places, {total_changes} changes")

# Check for remaining untranslated features
print("\n=== Remaining untranslated kidFeatures ===")
all_untranslated = []
for filename in sorted(os.listdir(research_dir)):
    if filename.endswith('.json'):
        filepath = os.path.join(research_dir, filename)
        untranslated = find_untranslated_features(filepath)
        all_untranslated.extend(untranslated)

if all_untranslated:
    unique_features = sorted(set(f for _, f in all_untranslated))
    print(f"Found {len(unique_features)} unique untranslated features:")
    for f in unique_features:
        print(f'    "{f}": "",')
else:
    print("All features translated!")
