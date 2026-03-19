import type { Recipe, RecipeCategory, KidApproval } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";
import type { IStorage } from "./interface";
import { BasePlaceStorage } from "./base";

// ============================================================
// In-Memory fallback (no DATABASE_URL)
// ============================================================

export class MemStorage extends BasePlaceStorage implements IStorage {
  // Store per-user data
  private favoritesMap: Map<string, Set<string>> = new Map();
  private visitedMap: Map<string, Set<string>> = new Map();
  private recipesMap: Map<string, Recipe[]> = new Map();
  private ratingsMap: Map<string, Map<string, number>> = new Map();

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

  async getRatings(userId: string): Promise<Record<string, number>> {
    const userRatings = this.ratingsMap.get(userId);
    if (!userRatings) return {};
    return Object.fromEntries(userRatings);
  }

  async setRating(userId: string, placeId: string, rating: number): Promise<number> {
    if (!this.ratingsMap.has(userId)) this.ratingsMap.set(userId, new Map());
    this.ratingsMap.get(userId)!.set(placeId, rating);
    return rating;
  }
}
