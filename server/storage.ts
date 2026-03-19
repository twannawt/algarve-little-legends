import { type Place, type Suggestion, type WeatherData, type Recipe, type RecipeCategory, type KidApproval, type RecipeDifficulty } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { getDb, hasDatabase } from "./db";
import { recipes as recipesTable, favorites as favoritesTable, visited as visitedTable } from "./db/schema";

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
  return data.map((r) => ({
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
  return data.map((b) => ({
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
  return data.map((p) => {
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
  return data.map((a) => ({
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
  getRandomPlace(category?: string): Place;
  getRandomRecipe(userId: string, category?: string): Promise<Recipe | null>;
  getFavorites(userId: string): Promise<string[]>;
  toggleFavorite(userId: string, id: string): Promise<boolean>;
  getVisited(userId: string): Promise<string[]>;
  toggleVisited(userId: string, id: string): Promise<boolean>;
  addSuggestion(s: Omit<Suggestion, "id" | "createdAt">): Suggestion;
  getSuggestions(): Suggestion[];
  getWeather(): Promise<WeatherData | null>;
  getDagplan(): { restaurant: Place; activity: Place; playground: Place };
  addPlace(place: Omit<Place, "id">): Place;
  // Recipe methods — all async, user-scoped
  getAllRecipes(userId: string): Promise<Recipe[]>;
  addRecipe(userId: string, recipe: Omit<Recipe, "id" | "createdAt" | "cooked" | "favorite" | "kidApproval"> & { prepTime?: number; difficulty?: RecipeDifficulty }): Promise<Recipe>;
  deleteRecipe(userId: string, id: string): Promise<boolean>;
  toggleRecipeCooked(userId: string, id: string): Promise<boolean>;
  toggleRecipeFavorite(userId: string, id: string): Promise<boolean>;
  toggleRecipeKidApproval(userId: string, id: string, tag: KidApproval): Promise<KidApproval[]>;
  updateRecipeCategories(userId: string, id: string, categories: RecipeCategory[]): Promise<Recipe | null>;
  getRecipeDagplan(userId: string): Promise<{ ontbijt: Recipe | null; lunch: Recipe | null; diner: Recipe | null }>;
  addRecentlyViewed(userId: string, placeId: string): void;
  getRecentlyViewed(userId: string): string[];
}

// ============================================================
// Base class with shared place logic (read-only from JSON)
// ============================================================

class BasePlaceStorage {
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

  getRandomPlace(category?: string): Place {
    const pool = category ? this.places.filter(p => p.category === category) : this.places;
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx] || this.places[0];
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

// ============================================================
// PostgreSQL storage — recipes, favorites, visited in database
// ============================================================

export class PgStorage extends BasePlaceStorage implements IStorage {
  async getFavorites(userId: string): Promise<string[]> {
    const db = getDb();
    const rows = await db.select().from(favoritesTable).where(eq(favoritesTable.userId, userId));
    return rows.map((r) => r.placeId);
  }

  async toggleFavorite(userId: string, id: string): Promise<boolean> {
    const db = getDb();
    const existing = await db.select().from(favoritesTable).where(
      and(eq(favoritesTable.userId, userId), eq(favoritesTable.placeId, id))
    );
    if (existing.length > 0) {
      await db.delete(favoritesTable).where(
        and(eq(favoritesTable.userId, userId), eq(favoritesTable.placeId, id))
      );
      return false;
    } else {
      await db.insert(favoritesTable).values({ userId, placeId: id, createdAt: new Date().toISOString() });
      return true;
    }
  }

  async getVisited(userId: string): Promise<string[]> {
    const db = getDb();
    const rows = await db.select().from(visitedTable).where(eq(visitedTable.userId, userId));
    return rows.map((r) => r.placeId);
  }

  async toggleVisited(userId: string, id: string): Promise<boolean> {
    const db = getDb();
    const existing = await db.select().from(visitedTable).where(
      and(eq(visitedTable.userId, userId), eq(visitedTable.placeId, id))
    );
    if (existing.length > 0) {
      await db.delete(visitedTable).where(
        and(eq(visitedTable.userId, userId), eq(visitedTable.placeId, id))
      );
      return false;
    } else {
      await db.insert(visitedTable).values({ userId, placeId: id, createdAt: new Date().toISOString() });
      return true;
    }
  }

  async getAllRecipes(userId: string): Promise<Recipe[]> {
    const db = getDb();
    const rows = await db.select().from(recipesTable).where(eq(recipesTable.userId, userId));
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      imageUrl: r.imageUrl || undefined,
      description: r.description || undefined,
      siteName: r.siteName || undefined,
      categories: (r.categories || []) as RecipeCategory[],
      cooked: r.cooked,
      favorite: r.favorite ?? false,
      kidApproval: (r.kidApproval || []) as KidApproval[],
      createdAt: r.createdAt,
    }));
  }

  async addRecipe(userId: string, recipe: Omit<Recipe, "id" | "createdAt" | "cooked" | "favorite" | "kidApproval">): Promise<Recipe> {
    const db = getDb();
    const id = `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = new Date().toISOString();
    const newRecipe = {
      id,
      userId,
      title: recipe.title,
      url: recipe.url,
      imageUrl: recipe.imageUrl || null,
      description: recipe.description || null,
      siteName: recipe.siteName || null,
      categories: recipe.categories as string[],
      cooked: false,
      favorite: false,
      kidApproval: [] as string[],
      createdAt,
    };
    await db.insert(recipesTable).values(newRecipe);
    return {
      ...newRecipe,
      imageUrl: newRecipe.imageUrl || undefined,
      description: newRecipe.description || undefined,
      siteName: newRecipe.siteName || undefined,
      categories: newRecipe.categories as RecipeCategory[],
      kidApproval: [] as KidApproval[],
    };
  }

  async deleteRecipe(userId: string, id: string): Promise<boolean> {
    const db = getDb();
    await db.delete(recipesTable).where(
      and(eq(recipesTable.id, id), eq(recipesTable.userId, userId))
    );
    return true;
  }

  async toggleRecipeCooked(userId: string, id: string): Promise<boolean> {
    const db = getDb();
    const rows = await db.select().from(recipesTable).where(
      and(eq(recipesTable.id, id), eq(recipesTable.userId, userId))
    );
    if (rows.length === 0) return false;
    const newValue = !rows[0].cooked;
    await db.update(recipesTable).set({ cooked: newValue }).where(eq(recipesTable.id, id));
    return newValue;
  }

  async toggleRecipeFavorite(userId: string, id: string): Promise<boolean> {
    const db = getDb();
    const rows = await db.select().from(recipesTable).where(
      and(eq(recipesTable.id, id), eq(recipesTable.userId, userId))
    );
    if (rows.length === 0) return false;
    const newValue = !rows[0].favorite;
    await db.update(recipesTable).set({ favorite: newValue }).where(eq(recipesTable.id, id));
    return newValue;
  }

  async toggleRecipeKidApproval(userId: string, id: string, tag: KidApproval): Promise<KidApproval[]> {
    const db = getDb();
    const rows = await db.select().from(recipesTable).where(
      and(eq(recipesTable.id, id), eq(recipesTable.userId, userId))
    );
    if (rows.length === 0) return [];
    const current = (rows[0].kidApproval || []) as KidApproval[];
    const newValue = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    await db.update(recipesTable).set({ kidApproval: newValue as string[] }).where(eq(recipesTable.id, id));
    return newValue;
  }

  async updateRecipeCategories(userId: string, id: string, categories: RecipeCategory[]): Promise<Recipe | null> {
    const db = getDb();
    const rows = await db.select().from(recipesTable).where(
      and(eq(recipesTable.id, id), eq(recipesTable.userId, userId))
    );
    if (rows.length === 0) return null;
    await db.update(recipesTable).set({ categories: categories as string[] }).where(eq(recipesTable.id, id));
    const updated = await db.select().from(recipesTable).where(eq(recipesTable.id, id));
    const r = updated[0];
    return {
      id: r.id,
      title: r.title,
      url: r.url,
      imageUrl: r.imageUrl || undefined,
      description: r.description || undefined,
      siteName: r.siteName || undefined,
      categories: (r.categories || []) as RecipeCategory[],
      cooked: r.cooked,
      favorite: r.favorite,
      kidApproval: (r.kidApproval || []) as KidApproval[],
      createdAt: r.createdAt,
    };
  }

}

// ============================================================
// In-Memory fallback (no DATABASE_URL)
// ============================================================

export class MemStorage extends BasePlaceStorage implements IStorage {
  // Store per-user data
  private favoritesMap: Map<string, Set<string>> = new Map();
  private visitedMap: Map<string, Set<string>> = new Map();
  private recipesMap: Map<string, Recipe[]> = new Map();

  constructor() {
    super();

    // Load persisted recipes from file into "default" user
    const recipesPath = path.join(process.cwd(), "data", "recipes.json");
    try {
      if (fs.existsSync(recipesPath)) {
        const recipes = JSON.parse(fs.readFileSync(recipesPath, "utf-8"));
        this.recipesMap.set("default", recipes);
      }
    } catch (e) {
      console.error("Failed to load recipes:", e);
    }
  }

  private getUserRecipes(userId: string): Recipe[] {
    return this.recipesMap.get(userId) || [];
  }

  private persistRecipes(userId: string) {
    // Only persist "default" user to file for backward compat
    if (userId !== "default") return;
    try {
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(path.join(dataDir, "recipes.json"), JSON.stringify(this.getUserRecipes(userId), null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to persist recipes:", e);
    }
  }

  async getFavorites(userId: string): Promise<string[]> {
    return Array.from(this.favoritesMap.get(userId) || []);
  }

  async toggleFavorite(userId: string, id: string): Promise<boolean> {
    if (!this.favoritesMap.has(userId)) this.favoritesMap.set(userId, new Set());
    const set = this.favoritesMap.get(userId)!;
    if (set.has(id)) {
      set.delete(id);
      return false;
    } else {
      set.add(id);
      return true;
    }
  }

  async getVisited(userId: string): Promise<string[]> {
    return Array.from(this.visitedMap.get(userId) || []);
  }

  async toggleVisited(userId: string, id: string): Promise<boolean> {
    if (!this.visitedMap.has(userId)) this.visitedMap.set(userId, new Set());
    const set = this.visitedMap.get(userId)!;
    if (set.has(id)) {
      set.delete(id);
      return false;
    } else {
      set.add(id);
      return true;
    }
  }

  async getAllRecipes(userId: string): Promise<Recipe[]> {
    const recipes = this.getUserRecipes(userId);
    for (const r of recipes) {
      if (!r.kidApproval) {
        r.kidApproval = (r as any).kidFavorite ? ["beiden"] : [];
        delete (r as any).kidFavorite;
      }
      if (typeof r.favorite !== "boolean") {
        r.favorite = false;
      }
    }
    return recipes;
  }

  async addRecipe(userId: string, recipe: Omit<Recipe, "id" | "createdAt" | "cooked" | "favorite" | "kidApproval">): Promise<Recipe> {
    const newRecipe: Recipe = {
      ...recipe,
      id: `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      cooked: false,
      favorite: false,
      kidApproval: [],
      createdAt: new Date().toISOString(),
    };
    if (!this.recipesMap.has(userId)) this.recipesMap.set(userId, []);
    this.recipesMap.get(userId)!.push(newRecipe);
    this.persistRecipes(userId);
    return newRecipe;
  }

  async deleteRecipe(userId: string, id: string): Promise<boolean> {
    const recipes = this.getUserRecipes(userId);
    const idx = recipes.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    recipes.splice(idx, 1);
    this.persistRecipes(userId);
    return true;
  }

  async toggleRecipeCooked(userId: string, id: string): Promise<boolean> {
    const recipe = this.getUserRecipes(userId).find((r) => r.id === id);
    if (!recipe) return false;
    recipe.cooked = !recipe.cooked;
    this.persistRecipes(userId);
    return recipe.cooked;
  }

  async toggleRecipeKidApproval(userId: string, id: string, tag: KidApproval): Promise<KidApproval[]> {
    const recipe = this.getUserRecipes(userId).find((r) => r.id === id);
    if (!recipe) return [];
    if (!recipe.kidApproval) recipe.kidApproval = [];
    if (recipe.kidApproval.includes(tag)) {
      recipe.kidApproval = recipe.kidApproval.filter((t) => t !== tag);
    } else {
      recipe.kidApproval.push(tag);
    }
    this.persistRecipes(userId);
    return recipe.kidApproval;
  }

  async toggleRecipeFavorite(userId: string, id: string): Promise<boolean> {
    const recipe = this.getUserRecipes(userId).find((r) => r.id === id);
    if (!recipe) return false;
    recipe.favorite = !recipe.favorite;
    this.persistRecipes(userId);
    return recipe.favorite;
  }

  async updateRecipeCategories(userId: string, id: string, categories: RecipeCategory[]): Promise<Recipe | null> {
    const recipe = this.getUserRecipes(userId).find((r) => r.id === id);
    if (!recipe) return null;
    recipe.categories = categories;
    this.persistRecipes(userId);
    return recipe;
  }

}

// ============================================================
// Export the storage instance — auto-selects based on DATABASE_URL
// ============================================================

export const storage: IStorage = hasDatabase() ? new PgStorage() : new MemStorage();
