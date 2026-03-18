import { type Place, type Suggestion, type WeatherData } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

function loadJSON(filePath: string): any[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeRestaurants(data: any[]): Place[] {
  return data.map((r, i) => ({
    id: `restaurant-${slugify(r.name)}`,
    name: r.name,
    location: r.location,
    latitude: r.latitude,
    longitude: r.longitude,
    category: "restaurant" as const,
    description: r.description,
    kidFeatures: r.kidFeatures || [],
    ageRange: r.ageRange || "",
    tip: r.tip || "",
    cuisine: r.cuisine,
    priceRange: r.priceRange,
    website: r.website || undefined,
    imageUrl: r.imageUrl,
    imageAlt: r.imageAlt,
  }));
}

function normalizeBeaches(data: any[]): Place[] {
  return data.map((b, i) => ({
    id: `beach-${slugify(b.name)}`,
    name: b.name,
    location: b.location,
    latitude: b.latitude,
    longitude: b.longitude,
    category: "beach" as const,
    description: b.description,
    kidFeatures: b.kidFeatures || [],
    ageRange: b.ageRange || "",
    tip: b.tip || "",
    facilities: b.facilities,
    bestSeason: b.bestSeason,
    imageUrl: b.imageUrl,
    imageAlt: b.imageAlt,
  }));
}

function normalizePlaygroundsActivities(data: any[]): Place[] {
  return data.map((p, i) => {
    const cat = p.category;
    const isPlayground = cat === "playground" || cat === "park";
    return {
      id: `${isPlayground ? "playground" : "activity"}-${slugify(p.name)}`,
      name: p.name,
      location: p.location,
      latitude: p.latitude,
      longitude: p.longitude,
      category: (isPlayground ? "playground" : "activity") as Place["category"],
      subcategory: cat,
      description: p.description,
      kidFeatures: p.kidFeatures || [],
      ageRange: p.ageRange || "",
      tip: p.tip || "",
      cost: p.cost,
      openingHours: p.openingHours,
      website: p.website || undefined,
      priceAdult: p.priceAdult,
      priceChild: p.priceChild,
      season: p.season,
      imageUrl: p.imageUrl,
      imageAlt: p.imageAlt,
    };
  });
}

function normalizeAttractions(data: any[]): Place[] {
  return data.map((a, i) => ({
    id: `attraction-${slugify(a.name)}`,
    name: a.name,
    location: a.location,
    latitude: a.latitude,
    longitude: a.longitude,
    category: "attraction" as const,
    subcategory: a.category,
    description: a.description,
    kidFeatures: a.kidFeatures || [],
    ageRange: a.ageRange || "",
    tip: a.tip || "",
    cost: a.cost,
    openingHours: a.openingHours,
    season: a.season,
    website: a.website || undefined,
    priceAdult: a.priceAdult,
    priceChild: a.priceChild,
    imageUrl: a.imageUrl,
    imageAlt: a.imageAlt,
  }));
}

export interface IStorage {
  getAllPlaces(): Place[];
  getPlaceById(id: string): Place | undefined;
  getPlacesByCategory(category: string): Place[];
  searchPlaces(query: string): Place[];
  getCategoryCounts(): Record<string, number>;
  getRandomPlace(): Place;
  getFavorites(): string[];
  toggleFavorite(id: string): boolean;
  getVisited(): string[];
  toggleVisited(id: string): boolean;
  addSuggestion(s: Omit<Suggestion, "id" | "createdAt">): Suggestion;
  getSuggestions(): Suggestion[];
  getWeather(): Promise<WeatherData | null>;
  getDagplan(): { restaurant: Place; activity: Place; playground: Place };
  addPlace(place: Omit<Place, "id">): Place;
}

export class MemStorage implements IStorage {
  private places: Place[];
  private favorites: Set<string>;
  private visited: Set<string>;
  private suggestions: Suggestion[];
  private weatherCache: { data: WeatherData; fetchedAt: number } | null;

  constructor() {
    this.favorites = new Set();
    this.visited = new Set();
    this.suggestions = [];
    this.weatherCache = null;
    this.places = [];

    const researchDir = path.join(process.cwd(), "research");
    try {
      const restaurants = loadJSON(path.join(researchDir, "restaurants.json"));
      const beaches = loadJSON(path.join(researchDir, "beaches.json"));
      const playgrounds = loadJSON(path.join(researchDir, "playgrounds_activities.json"));
      const attractions = loadJSON(path.join(researchDir, "attractions.json"));

      this.places = [
        ...normalizeRestaurants(restaurants),
        ...normalizeBeaches(beaches),
        ...normalizePlaygroundsActivities(playgrounds),
        ...normalizeAttractions(attractions),
      ];
    } catch (e) {
      console.error("Failed to load research data:", e);
    }

  }

  getAllPlaces(): Place[] {
    return this.places;
  }

  getPlaceById(id: string): Place | undefined {
    return this.places.find((p) => p.id === id);
  }

  getPlacesByCategory(category: string): Place[] {
    return this.places.filter((p) => p.category === category);
  }

  searchPlaces(query: string): Place[] {
    const q = query.toLowerCase();
    return this.places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.kidFeatures.some((f) => f.toLowerCase().includes(q))
    );
  }

  getCategoryCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const p of this.places) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }

  getRandomPlace(): Place {
    const idx = Math.floor(Math.random() * this.places.length);
    return this.places[idx];
  }

  getFavorites(): string[] {
    return Array.from(this.favorites);
  }

  toggleFavorite(id: string): boolean {
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
      return false;
    } else {
      this.favorites.add(id);
      return true;
    }
  }

  getVisited(): string[] {
    return Array.from(this.visited);
  }

  toggleVisited(id: string): boolean {
    if (this.visited.has(id)) {
      this.visited.delete(id);
      return false;
    } else {
      this.visited.add(id);
      return true;
    }
  }

  addSuggestion(s: Omit<Suggestion, "id" | "createdAt">): Suggestion {
    const suggestion: Suggestion = {
      ...s,
      id: `suggestion-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.suggestions.push(suggestion);
    return suggestion;
  }

  addPlace(place: Omit<Place, "id">): Place {
    const id = `${place.category}-${slugify(place.name)}-${Date.now()}`;
    const newPlace: Place = { id, ...place };
    this.places.push(newPlace);

    // Also persist to the appropriate research JSON file
    try {
      const researchDir = path.join(process.cwd(), "research");
      let filePath: string;
      let entry: any;

      if (place.category === "restaurant") {
        filePath = path.join(researchDir, "restaurants.json");
        entry = {
          name: place.name,
          location: place.location,
          latitude: place.latitude,
          longitude: place.longitude,
          cuisine: place.cuisine || "",
          priceRange: place.priceRange || "€€",
          description: place.description,
          kidFeatures: place.kidFeatures,
          ageRange: place.ageRange,
          address: "",
          website: place.website || "",
          tip: place.tip || "",
          sources: [],
          imageUrl: place.imageUrl || "",
          imageAlt: place.imageAlt || `${place.name} in ${place.location}`,
        };
      } else if (place.category === "beach") {
        filePath = path.join(researchDir, "beaches.json");
        entry = {
          name: place.name,
          location: place.location,
          latitude: place.latitude,
          longitude: place.longitude,
          description: place.description,
          kidFeatures: place.kidFeatures,
          facilities: place.facilities || [],
          bestSeason: "June–September",
          ageRange: place.ageRange,
          tip: place.tip || "",
          sources: [],
          imageUrl: place.imageUrl || "",
          imageAlt: place.imageAlt || `${place.name} in ${place.location}`,
        };
      } else if (place.category === "playground" || place.category === "activity") {
        filePath = path.join(researchDir, "playgrounds_activities.json");
        entry = {
          name: place.name,
          location: place.location,
          latitude: place.latitude,
          longitude: place.longitude,
          category: place.category === "playground" ? "playground" : "activity",
          description: place.description,
          kidFeatures: place.kidFeatures,
          ageRange: place.ageRange,
          cost: place.cost || "",
          openingHours: place.openingHours || "",
          tip: place.tip || "",
          sources: [],
          imageUrl: place.imageUrl || "",
          imageAlt: place.imageAlt || `${place.name} in ${place.location}`,
        };
      } else {
        filePath = path.join(researchDir, "attractions.json");
        entry = {
          name: place.name,
          location: place.location,
          latitude: place.latitude,
          longitude: place.longitude,
          category: "attraction",
          description: place.description,
          kidFeatures: place.kidFeatures,
          ageRange: place.ageRange,
          priceAdult: place.priceAdult || "",
          priceChild: place.priceChild || "",
          openingHours: place.openingHours || "",
          season: "Year-round",
          website: place.website || "",
          tip: place.tip || "",
          sources: [],
          imageUrl: place.imageUrl || "",
          imageAlt: place.imageAlt || `${place.name} in ${place.location}`,
        };
      }

      const existing = loadJSON(filePath);
      existing.push(entry);
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to persist place:", e);
    }

    return newPlace;
  }

  getSuggestions(): Suggestion[] {
    return this.suggestions;
  }

  async getWeather(): Promise<WeatherData | null> {
    const CACHE_MS = 30 * 60 * 1000;
    if (this.weatherCache && Date.now() - this.weatherCache.fetchedAt < CACHE_MS) {
      return this.weatherCache.data;
    }
    try {
      const url = "https://api.open-meteo.com/v1/forecast?latitude=37.135&longitude=-8.452&current=temperature_2m,weathercode,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe/Lisbon&forecast_days=3";
      const res = await fetch(url);
      const json = await res.json();
      const data: WeatherData = {
        current: {
          temperature: json.current.temperature_2m,
          weathercode: json.current.weathercode,
          windspeed: json.current.windspeed_10m,
        },
        daily: json.daily.time.map((date: string, i: number) => ({
          date,
          weathercode: json.daily.weathercode[i],
          tempMax: json.daily.temperature_2m_max[i],
          tempMin: json.daily.temperature_2m_min[i],
        })),
      };
      this.weatherCache = { data, fetchedAt: Date.now() };
      return data;
    } catch (e) {
      console.error("Weather fetch failed:", e);
      return this.weatherCache?.data ?? null;
    }
  }

  getDagplan(): { restaurant: Place; activity: Place; playground: Place } {
    const restaurants = this.places.filter((p) => p.category === "restaurant");
    const activities = this.places.filter((p) => p.category === "activity" || p.category === "attraction");
    const playgrounds = this.places.filter((p) => p.category === "playground" || p.category === "beach");

    const pick = (arr: Place[]) => arr[Math.floor(Math.random() * arr.length)];

    return {
      restaurant: pick(restaurants),
      activity: pick(activities),
      playground: pick(playgrounds),
    };
  }
}

export const storage = new MemStorage();
