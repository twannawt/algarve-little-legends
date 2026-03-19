export interface Place {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  category: 'restaurant' | 'beach' | 'playground' | 'activity' | 'attraction';
  subcategory?: string;
  description: string;
  kidFeatures: string[];
  ageRange: string;
  tip: string;
  cuisine?: string;
  priceRange?: string;
  priceAdult?: string;
  priceChild?: string;
  openingHours?: string;
  season?: string;
  website?: string;
  facilities?: string[];
  bestSeason?: string;
  cost?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface Suggestion {
  id: string;
  name: string;
  location: string;
  category: Place['category'];
  description: string;
  createdAt: string;
}

export interface UrlImportResult {
  name: string;
  location: string;
  category: Place['category'];
  description: string;
  latitude: number;
  longitude: number;
  website: string;
  googleMapsUrl: string;
  instagramUrl: string;
  imageUrl: string;
}

export type RecipeCategory = 'ontbijt' | 'lunch' | 'diner' | 'snack' | 'tussendoortje' | 'overig';

export type RecipeDifficulty = 'makkelijk' | 'gemiddeld' | 'moeilijk';

export type KidApproval = 'beiden' | 'charlie' | 'bodi';

export interface Recipe {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  description?: string;
  siteName?: string;
  categories: RecipeCategory[];
  cooked: boolean;
  favorite: boolean;
  kidApproval: KidApproval[];
  prepTime?: number; // minutes
  difficulty?: RecipeDifficulty;
  createdAt: string;
}

export interface RecipeImportResult {
  title: string;
  imageUrl: string;
  description: string;
  siteName: string;
  url?: string;
}

export interface WeatherData {
  current: {
    temperature: number;
    weathercode: number;
    windspeed: number;
  };
  daily: {
    date: string;
    weathercode: number;
    tempMax: number;
    tempMin: number;
  }[];
}
