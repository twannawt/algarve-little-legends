import { type Place, type Suggestion, type Review, type WeatherData } from "@shared/schema";
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
  getReviews(placeId: string): Review[];
  addReview(placeId: string, review: Omit<Review, "id" | "placeId" | "createdAt">): Review;
  getDagplan(): { restaurant: Place; activity: Place; playground: Place };
}

export class MemStorage implements IStorage {
  private places: Place[];
  private favorites: Set<string>;
  private visited: Set<string>;
  private suggestions: Suggestion[];
  private reviews: Review[];
  private weatherCache: { data: WeatherData; fetchedAt: number } | null;

  constructor() {
    this.favorites = new Set();
    this.visited = new Set();
    this.suggestions = [];
    this.reviews = [];
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

    // Seed reviews for popular places
    this.seedReviews();
  }

  private seedReviews() {
    const placeIds = this.places.slice(0, 8).map((p) => p.id);
    const seedData: { placeId: string; rating: number; comment: string; author: string }[] = [];

    if (placeIds[0]) {
      seedData.push(
        { placeId: placeIds[0], rating: 5, comment: "Geweldige plek voor de kinderen! Eten was ook lekker.", author: "Marieke" },
        { placeId: placeIds[0], rating: 4, comment: "Fijne sfeer, aanrader voor gezinnen.", author: "Pieter" },
      );
    }
    if (placeIds[1]) {
      seedData.push(
        { placeId: placeIds[1], rating: 5, comment: "Prachtig strand, kinderen vonden het fantastisch!", author: "Sanne" },
        { placeId: placeIds[1], rating: 4, comment: "Mooi rustig, goed voor kleine kinderen.", author: "Tom" },
        { placeId: placeIds[1], rating: 5, comment: "Onze favoriet! We komen hier elke vakantie.", author: "Lisa" },
      );
    }
    if (placeIds[2]) {
      seedData.push(
        { placeId: placeIds[2], rating: 4, comment: "Leuke speeltuin, goed onderhouden.", author: "Jan" },
        { placeId: placeIds[2], rating: 5, comment: "De kinderen wilden niet meer weg!", author: "Eva" },
      );
    }
    if (placeIds[3]) {
      seedData.push(
        { placeId: placeIds[3], rating: 5, comment: "Super activiteit voor het hele gezin.", author: "Mark" },
        { placeId: placeIds[3], rating: 3, comment: "Leuk maar een beetje prijzig.", author: "Anna" },
      );
    }
    if (placeIds[4]) {
      seedData.push(
        { placeId: placeIds[4], rating: 4, comment: "Mooie attractie, kinderen genoten ervan.", author: "Karin" },
        { placeId: placeIds[4], rating: 5, comment: "Een must-visit! Heel leerzaam voor de kleintjes.", author: "Dennis" },
      );
    }
    if (placeIds[5]) {
      seedData.push(
        { placeId: placeIds[5], rating: 4, comment: "Fijne locatie, goed bereikbaar.", author: "Sandra" },
      );
    }
    if (placeIds[6]) {
      seedData.push(
        { placeId: placeIds[6], rating: 5, comment: "Toplocatie voor een dagje uit met de kids!", author: "Wouter" },
        { placeId: placeIds[6], rating: 4, comment: "Lekker eten en kindvriendelijk personeel.", author: "Inge" },
      );
    }
    if (placeIds[7]) {
      seedData.push(
        { placeId: placeIds[7], rating: 5, comment: "Absoluut een van de beste plekken hier.", author: "Bas" },
      );
    }

    for (const s of seedData) {
      this.reviews.push({
        id: `review-${this.reviews.length + 1}`,
        placeId: s.placeId,
        rating: s.rating,
        comment: s.comment,
        author: s.author,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
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

  getReviews(placeId: string): Review[] {
    return this.reviews.filter((r) => r.placeId === placeId);
  }

  addReview(placeId: string, review: Omit<Review, "id" | "placeId" | "createdAt">): Review {
    const newReview: Review = {
      ...review,
      id: `review-${Date.now()}`,
      placeId,
      createdAt: new Date().toISOString(),
    };
    this.reviews.push(newReview);
    return newReview;
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
