import type { Recipe, RecipeCategory, KidApproval } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { recipes as recipesTable, favorites as favoritesTable, visited as visitedTable } from "../db/schema";
import type { IStorage } from "./interface";
import { BasePlaceStorage } from "./base";

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
