import type { Place, Suggestion, WeatherData, Recipe, RecipeCategory, KidApproval, RecipeDifficulty } from "@shared/schema";

export interface IStorage {
  getAllPlaces(): Place[];
  getPlaceById(id: string): Place | undefined;
  getPlacesByCategory(category: string): Place[];
  searchPlaces(query: string): Place[];
  getCategoryCounts(): Record<string, number>;
  getRandomPlace(category?: string): Place | null;
  getRandomRecipe(userId: string, category?: string): Promise<Recipe | null>;
  getFavorites(userId: string): Promise<string[]>;
  toggleFavorite(userId: string, id: string): Promise<boolean>;
  getVisited(userId: string): Promise<string[]>;
  toggleVisited(userId: string, id: string): Promise<boolean>;
  addSuggestion(s: Omit<Suggestion, "id" | "createdAt">): Suggestion;
  getSuggestions(): Suggestion[];
  getWeather(): Promise<WeatherData | null>;
  getDagplan(): { restaurant: Place | null; activity: Place | null; playground: Place | null };
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
