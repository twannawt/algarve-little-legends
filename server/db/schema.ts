import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

// Recipes table — stores all recipe data
export const recipes = pgTable("recipes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  siteName: text("site_name"),
  categories: text("categories").array().notNull().default([]),
  cooked: boolean("cooked").notNull().default(false),
  kidFavorite: boolean("kid_favorite").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

// Favorites table — stores place IDs that are favorited
export const favorites = pgTable("favorites", {
  placeId: text("place_id").primaryKey(),
  createdAt: text("created_at").notNull(),
});

// Visited table — stores place IDs that have been visited
export const visited = pgTable("visited", {
  placeId: text("place_id").primaryKey(),
  createdAt: text("created_at").notNull(),
});
