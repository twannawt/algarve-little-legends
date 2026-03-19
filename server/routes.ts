import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { requireAuth, getAuth } from "@clerk/express";
import { storage } from "./storage";
import { importFromUrls, importRecipeFromUrl, bulkImportRecipes, bulkImportPlaces } from "./url-import";
import type { RecipeCategory, KidApproval } from "@shared/schema";
import { KID_NAMES } from "@shared/config";

// Helper to extract userId from Clerk auth (falls back to "default" for backward compat)
function getUserId(req: Request): string {
  const auth = getAuth(req);
  return auth?.userId || "default";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ===== PUBLIC ROUTES (no auth required) =====

  app.get("/api/places", (_req, res) => {
    const { category, search } = _req.query;
    let places = storage.getAllPlaces();

    if (category && typeof category === "string") {
      places = places.filter((p) => p.category === category);
    }
    if (search && typeof search === "string") {
      places = storage.searchPlaces(search);
      if (category && typeof category === "string") {
        places = places.filter((p) => p.category === category);
      }
    }

    res.json(places);
  });

  app.get("/api/places/:id", (req, res) => {
    const place = storage.getPlaceById(req.params.id);
    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }
    res.json(place);
  });

  app.get("/api/categories", (_req, res) => {
    res.json(storage.getCategoryCounts());
  });

  app.get("/api/random", (_req, res) => {
    const { category } = _req.query;
    res.json(storage.getRandomPlace(typeof category === "string" ? category : undefined));
  });

  app.get("/api/weather", async (_req, res) => {
    const weather = await storage.getWeather();
    if (!weather) {
      return res.status(503).json({ message: "Weather unavailable" });
    }
    res.json(weather);
  });

  // URL import — extract place info from URLs (auth required)
  app.post("/api/import-url", requireAuth(), async (req, res) => {
    const { googleMapsUrl, websiteUrl, instagramUrl } = req.body;
    if (!googleMapsUrl && !websiteUrl && !instagramUrl) {
      return res.status(400).json({ message: "Vul minimaal één URL in" });
    }
    try {
      const result = await importFromUrls(
        googleMapsUrl || "",
        websiteUrl || "",
        instagramUrl || ""
      );
      res.json(result);
    } catch (e) {
      console.error("URL import failed:", e);
      res.status(500).json({ message: "Kon de URL niet verwerken" });
    }
  });

  // Add a new place directly (auth required)
  app.post("/api/places", requireAuth(), (req, res) => {
    const { name, location, category, description, latitude, longitude, website, imageUrl } = req.body;
    if (!name || !location || !category) {
      return res.status(400).json({ message: "Naam, locatie en categorie zijn verplicht" });
    }
    const place = storage.addPlace({
      name,
      location,
      latitude: latitude || 0,
      longitude: longitude || 0,
      category,
      description: description || "",
      kidFeatures: [],
      ageRange: "0-12",
      tip: "",
      website: website || undefined,
      imageUrl: imageUrl || undefined,
      imageAlt: `${name} in ${location}`,
    });
    res.json(place);
  });

  // Bulk import places from a page (auth required)
  app.post("/api/places/import-bulk", requireAuth(), async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL is verplicht" });
    }
    try {
      const results = await bulkImportPlaces(url);
      let imported = 0;
      for (const p of results) {
        if (p.name) {
          storage.addPlace({
            name: p.name,
            location: p.location || "Algarve",
            latitude: p.latitude || 0,
            longitude: p.longitude || 0,
            category: (p.category as any) || "attraction",
            description: p.description || "",
            kidFeatures: [],
            ageRange: "0-12",
            tip: "",
            website: p.website || undefined,
            imageUrl: p.imageUrl || undefined,
            imageAlt: `${p.name} in ${p.location || "Algarve"}`,
          });
          imported++;
        }
      }
      res.json({ imported, total: results.length });
    } catch (e) {
      console.error("Bulk place import failed:", e);
      res.status(500).json({ message: "Kon de pagina niet verwerken" });
    }
  });

  app.get("/api/suggestions", (_req, res) => {
    res.json(storage.getSuggestions());
  });

  app.post("/api/suggestions", requireAuth(), (req, res) => {
    const { name, location, category, description } = req.body;
    if (!name || !location || !category) {
      return res.status(400).json({ message: "Naam, locatie en categorie zijn verplicht" });
    }
    const suggestion = storage.addSuggestion({ name, location, category, description: description || "" });
    res.json(suggestion);
  });

  // Auth status check — returns userId if signed in, null if not
  app.get("/api/auth/status", (req, res) => {
    const auth = getAuth(req);
    res.json({ userId: auth?.userId || null });
  });

  // ===== PROTECTED ROUTES (auth required) =====

  // Recently viewed — user-scoped
  app.get("/api/recently-viewed", requireAuth(), (req, res) => {
    const userId = getUserId(req);
    const ids = storage.getRecentlyViewed(userId);
    const places = ids.map(id => storage.getPlaceById(id)).filter(Boolean);
    res.json(places);
  });

  app.post("/api/recently-viewed/:id", requireAuth(), (req, res) => {
    const userId = getUserId(req);
    storage.addRecentlyViewed(userId, req.params.id);
    res.json({ ok: true });
  });

  // Favorites — user-scoped
  app.get("/api/favorites", requireAuth(), async (req, res) => {
    const userId = getUserId(req);
    const favs = await storage.getFavorites(userId);
    res.json(favs);
  });

  app.post("/api/favorites/:id", requireAuth(), async (req, res) => {
    const userId = getUserId(req);
    const isFavorite = await storage.toggleFavorite(userId, req.params.id);
    res.json({ id: req.params.id, isFavorite });
  });

  // Visited — user-scoped
  app.get("/api/visited", requireAuth(), async (req, res) => {
    const userId = getUserId(req);
    const vis = await storage.getVisited(userId);
    res.json(vis);
  });

  app.post("/api/visited/:id", requireAuth(), async (req, res) => {
    const userId = getUserId(req);
    const isVisited = await storage.toggleVisited(userId, req.params.id);
    res.json({ id: req.params.id, isVisited });
  });

  app.get("/api/dagplan", (_req, res) => {
    res.json(storage.getDagplan());
  });

  app.get("/api/recept-dagplan", requireAuth(), async (req, res) => {
    const userId = getUserId(req);
    const plan = await storage.getRecipeDagplan(userId);
    res.json(plan);
  });

  // ===== Recipe API (user-scoped) =====

  app.get("/api/recipes", requireAuth(), async (req, res) => {
    const userId = getUserId(req);
    const recipes = await storage.getAllRecipes(userId);
    res.json(recipes);
  });

  app.get("/api/recipes/random", requireAuth(), async (req, res) => {
    const userId = getUserId(req);
    const { category } = req.query;
    const recipe = await storage.getRandomRecipe(userId, typeof category === "string" ? category : undefined);
    if (!recipe) return res.status(404).json({ message: "Geen recepten gevonden" });
    res.json(recipe);
  });

  app.post("/api/recipes", requireAuth(), async (req, res) => {
    const userId = getUserId(req);
    const { title, url, imageUrl, description, siteName, categories, category } = req.body;
    if (!title || !url) {
      return res.status(400).json({ message: "Titel en URL zijn verplicht" });
    }
    let cats: RecipeCategory[] = [];
    if (Array.isArray(categories) && categories.length > 0) {
      cats = categories;
    } else if (category) {
      cats = [category];
    } else {
      cats = ["overig"];
    }
    const recipe = await storage.addRecipe(userId, {
      title,
      url,
      imageUrl: imageUrl || undefined,
      description: description || undefined,
      siteName: siteName || undefined,
      categories: cats,
    });
    res.json(recipe);
  });

  app.delete("/api/recipes/:id", requireAuth(), async (req, res) => {
    const userId = getUserId(req);
    const deleted = await storage.deleteRecipe(userId, req.params.id);
    if (!deleted) return res.status(404).json({ message: "Recept niet gevonden" });
    res.json({ success: true });
  });

  app.post("/api/recipes/:id/cooked", requireAuth(), async (req, res) => {
    const userId = getUserId(req);
    const cooked = await storage.toggleRecipeCooked(userId, req.params.id);
    res.json({ id: req.params.id, cooked });
  });

  app.post("/api/recipes/:id/favorite", requireAuth(), async (req, res) => {
    const userId = getUserId(req);
    const favorite = await storage.toggleRecipeFavorite(userId, req.params.id);
    res.json({ id: req.params.id, favorite });
  });

  app.post("/api/recipes/:id/kid-approval", requireAuth(), async (req, res) => {
    const userId = getUserId(req);
    const { tag } = req.body;
    const validTags: KidApproval[] = ["beiden", ...KID_NAMES.map(k => k.key as KidApproval)];
    if (!tag || !validTags.includes(tag)) {
      return res.status(400).json({ message: "Ongeldige tag" });
    }
    const kidApproval = await storage.toggleRecipeKidApproval(userId, req.params.id, tag);
    res.json({ id: req.params.id, kidApproval });
  });

  app.patch("/api/recipes/:id/categories", requireAuth(), async (req, res) => {
    const userId = getUserId(req);
    const { categories } = req.body;
    if (!Array.isArray(categories)) {
      return res.status(400).json({ message: "Categorieën moeten een array zijn" });
    }
    const recipe = await storage.updateRecipeCategories(userId, req.params.id, categories);
    if (!recipe) return res.status(404).json({ message: "Recept niet gevonden" });
    res.json(recipe);
  });

  app.post("/api/recipes/import-url", requireAuth(), async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL is verplicht" });
    }
    try {
      const result = await importRecipeFromUrl(url);
      res.json(result);
    } catch (e) {
      console.error("Recipe URL import failed:", e);
      res.status(500).json({ message: "Kon de URL niet verwerken" });
    }
  });

  app.post("/api/recipes/import-bulk", requireAuth(), async (req, res) => {
    const userId = getUserId(req);
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL is verplicht" });
    }
    try {
      const results = await bulkImportRecipes(url);
      let imported = 0;
      for (const r of results) {
        if (r.title && r.url) {
          await storage.addRecipe(userId, {
            title: r.title,
            url: r.url,
            imageUrl: r.imageUrl || undefined,
            description: r.description || undefined,
            siteName: r.siteName || undefined,
            categories: ["overig"],
          });
          imported++;
        }
      }
      res.json({ imported, total: results.length });
    } catch (e) {
      console.error("Bulk recipe import failed:", e);
      res.status(500).json({ message: "Kon de pagina niet verwerken" });
    }
  });

  return httpServer;
}
