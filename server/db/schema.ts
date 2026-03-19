import { pgTable, text, boolean, timestamp, primaryKey, index } from "drizzle-orm/pg-core";

// Recipes table — stores all recipe data (user-scoped)
export const recipes = pgTable("recipes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default("default"),
  title: text("title").notNull(),
  url: text("url").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  siteName: text("site_name"),
  categories: text("categories").array().notNull().default([]),
  cooked: boolean("cooked").notNull().default(false),
  favorite: boolean("favorite").notNull().default(false),
  kidApproval: text("kid_approval").array().notNull().default([]),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  userCreatedIdx: index("recipes_user_created_idx").on(table.userId, table.createdAt),
}));

// Favorites table — stores place IDs that are favorited (user-scoped)
export const favorites = pgTable("favorites", {
  userId: text("user_id").notNull().default("default"),
  placeId: text("place_id").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.placeId] }),
}));

// Visited table — stores place IDs that have been visited (user-scoped)
export const visited = pgTable("visited", {
  userId: text("user_id").notNull().default("default"),
  placeId: text("place_id").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.placeId] }),
}));
