import type { Place, Suggestion, WeatherData, Recipe, RecipeCategory } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";
import { loadJSON, slugify, normalizeRestaurants, normalizeBeaches, normalizePlaygroundsActivities, normalizeAttractions } from "./loaders";

// ============================================================
// Base class with shared place logic (read-only from JSON)
// ============================================================

export class BasePlaceStorage {
  protected places: Place[] = [];
  protected suggestions: Suggestion[] = [];
  protected weatherCache: { data: WeatherData; fetchedAt: number } | null = null;
  private recentlyViewedMap: Map<string, string[]> = new Map();

  addRecentlyViewed(userId: string, placeId: string): void {
    const list = this.recentlyViewedMap.get(userId) || [];
    const filtered = list.filter(id => id !== placeId);
    filtered.unshift(placeId);
    this.recentlyViewedMap.set(userId, filtered.slice(0, 5));
  }

  getRecentlyViewed(userId: string): string[] {
    return this.recentlyViewedMap.get(userId) || [];
  }

  constructor() {
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

  getRandomPlace(category?: string): Place | null {
    const pool = category ? this.places.filter(p => p.category === category) : this.places;
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async getRandomRecipe(userId: string, category?: string): Promise<Recipe | null> {
    const all = await this.getAllRecipes(userId);
    const pool = category ? all.filter(r => r.categories?.includes(category as RecipeCategory)) : all;
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
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

  getSuggestions(): Suggestion[] {
    return this.suggestions;
  }

  addPlace(place: Omit<Place, "id">): Place {
    const id = `${place.category}-${slugify(place.name)}-${Date.now()}`;
    const newPlace: Place = { id, ...place };
    this.places.push(newPlace);

    // Persist to the appropriate research JSON file
    try {
      const researchDir = path.join(process.cwd(), "research");
      let filePath: string;
      let entry: any;

      if (place.category === "restaurant") {
        filePath = path.join(researchDir, "restaurants.json");
        entry = {
          name: place.name, location: place.location, latitude: place.latitude, longitude: place.longitude,
          cuisine: place.cuisine || "", priceRange: place.priceRange || "€€", description: place.description,
          kidFeatures: place.kidFeatures, ageRange: place.ageRange, address: "", website: place.website || "",
          tip: place.tip || "", sources: [], imageUrl: place.imageUrl || "",
          imageAlt: place.imageAlt || `${place.name} in ${place.location}`,
        };
      } else if (place.category === "beach") {
        filePath = path.join(researchDir, "beaches.json");
        entry = {
          name: place.name, location: place.location, latitude: place.latitude, longitude: place.longitude,
          description: place.description, kidFeatures: place.kidFeatures, facilities: place.facilities || [],
          bestSeason: "June–September", ageRange: place.ageRange, tip: place.tip || "", sources: [],
          imageUrl: place.imageUrl || "", imageAlt: place.imageAlt || `${place.name} in ${place.location}`,
        };
      } else if (place.category === "playground" || place.category === "activity") {
        filePath = path.join(researchDir, "playgrounds_activities.json");
        entry = {
          name: place.name, location: place.location, latitude: place.latitude, longitude: place.longitude,
          category: place.category, description: place.description, kidFeatures: place.kidFeatures,
          ageRange: place.ageRange, cost: place.cost || "", openingHours: place.openingHours || "",
          tip: place.tip || "", sources: [], imageUrl: place.imageUrl || "",
          imageAlt: place.imageAlt || `${place.name} in ${place.location}`,
        };
      } else {
        filePath = path.join(researchDir, "attractions.json");
        entry = {
          name: place.name, location: place.location, latitude: place.latitude, longitude: place.longitude,
          category: "attraction", description: place.description, kidFeatures: place.kidFeatures,
          ageRange: place.ageRange, priceAdult: place.priceAdult || "", priceChild: place.priceChild || "",
          openingHours: place.openingHours || "", season: "Year-round", website: place.website || "",
          tip: place.tip || "", sources: [], imageUrl: place.imageUrl || "",
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

  getDagplan(): { restaurant: Place | null; activity: Place | null; playground: Place | null } {
    const restaurants = this.places.filter((p) => p.category === "restaurant");
    const activities = this.places.filter((p) => p.category === "activity" || p.category === "attraction");
    const playgrounds = this.places.filter((p) => p.category === "playground" || p.category === "beach");

    const pick = (arr: Place[]) => arr.length === 0 ? null : arr[Math.floor(Math.random() * arr.length)];

    return {
      restaurant: pick(restaurants),
      activity: pick(activities),
      playground: pick(playgrounds),
    };
  }

  // Abstract — implemented by subclasses
  async getAllRecipes(_userId: string): Promise<Recipe[]> { return []; }

  // Shared: recipe dagplan (identical logic for both storage backends)
  async getRecipeDagplan(userId: string): Promise<{ ontbijt: Recipe | null; lunch: Recipe | null; diner: Recipe | null }> {
    const all = await this.getAllRecipes(userId);
    const pick = (cat: RecipeCategory): Recipe | null => {
      const matching = all.filter((r) => (r.categories || []).includes(cat));
      if (matching.length === 0) return null;
      return matching[Math.floor(Math.random() * matching.length)];
    };
    return { ontbijt: pick("ontbijt"), lunch: pick("lunch"), diner: pick("diner") };
  }
}
