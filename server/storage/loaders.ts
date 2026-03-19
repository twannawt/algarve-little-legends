import type { Place } from "@shared/schema";
import * as fs from "fs";

export function loadJSON(filePath: string): any[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeRestaurants(data: any[]): Place[] {
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

export function normalizeBeaches(data: any[]): Place[] {
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

export function normalizePlaygroundsActivities(data: any[]): Place[] {
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

export function normalizeAttractions(data: any[]): Place[] {
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
