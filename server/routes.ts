import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { importFromUrls, importRecipeFromUrl, bulkImportRecipes, bulkImportPlaces } from "./url-import";
import type { RecipeCategory, KidApproval } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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

  // Recently viewed
  app.get("/api/recently-viewed", (_req, res) => {
    const ids = storage.getRecentlyViewed();
    const places = ids.map(id => storage.getPlaceById(id)).filter(Boolean);
    res.json(places);
  });

  app.post("/api/recently-viewed/:id", (req, res) => {
    storage.addRecentlyViewed(req.params.id);
    res.json({ ok: true });
  });

  app.get("/api/favorites", async (_req, res) => {
    const favs = await storage.getFavorites();
    res.json(favs);
  });

  app.post("/api/favorites/:id", async (req, res) => {
    const isFavorite = await storage.toggleFavorite(req.params.id);
    res.json({ id: req.params.id, isFavorite });
  });

  app.get("/api/random", (_req, res) => {
    const { category } = _req.query;
    res.json(storage.getRandomPlace(typeof category === "string" ? category : undefined));
  });

  app.get("/api/recipes/random", async (_req, res) => {
    const { category } = _req.query;
    const recipe = await storage.getRandomRecipe(typeof category === "string" ? category : undefined);
    if (!recipe) return res.status(404).json({ message: "Geen recepten gevonden" });
    res.json(recipe);
  });

  app.get("/api/weather", async (_req, res) => {
    const weather = await storage.getWeather();
    if (!weather) {
      return res.status(503).json({ message: "Weather unavailable" });
    }
    res.json(weather);
  });

  app.get("/api/visited", async (_req, res) => {
    const vis = await storage.getVisited();
    res.json(vis);
  });

  app.post("/api/visited/:id", async (req, res) => {
    const isVisited = await storage.toggleVisited(req.params.id);
    res.json({ id: req.params.id, isVisited });
  });

  app.get("/api/suggestions", (_req, res) => {
    res.json(storage.getSuggestions());
  });

  app.post("/api/suggestions", (req, res) => {
    const { name, location, category, description } = req.body;
    if (!name || !location || !category) {
      return res.status(400).json({ message: "Naam, locatie en categorie zijn verplicht" });
    }
    const suggestion = storage.addSuggestion({ name, location, category, description: description || "" });
    res.json(suggestion);
  });

  app.get("/api/dagplan", (_req, res) => {
    res.json(storage.getDagplan());
  });

  // URL import — extract place info from URLs
  app.post("/api/import-url", async (req, res) => {
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

  // Add a new place directly to the database
  app.post("/api/places", (req, res) => {
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

  app.get("/api/recept-dagplan", async (_req, res) => {
    const plan = await storage.getRecipeDagplan();
    res.json(plan);
  });

  // ===== Recipe API =====

  app.get("/api/recipes", async (_req, res) => {
    const recipes = await storage.getAllRecipes();
    res.json(recipes);
  });

  app.post("/api/recipes", async (req, res) => {
    const { title, url, imageUrl, description, siteName, categories, category } = req.body;
    if (!title || !url) {
      return res.status(400).json({ message: "Titel en URL zijn verplicht" });
    }
    // Support both 'categories' (array) and legacy 'category' (string)
    let cats: RecipeCategory[] = [];
    if (Array.isArray(categories) && categories.length > 0) {
      cats = categories;
    } else if (category) {
      cats = [category];
    } else {
      cats = ["overig"];
    }
    const recipe = await storage.addRecipe({
      title,
      url,
      imageUrl: imageUrl || undefined,
      description: description || undefined,
      siteName: siteName || undefined,
      categories: cats,
    });
    res.json(recipe);
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    const deleted = await storage.deleteRecipe(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Recept niet gevonden" });
    res.json({ success: true });
  });

  app.post("/api/recipes/:id/cooked", async (req, res) => {
    const cooked = await storage.toggleRecipeCooked(req.params.id);
    res.json({ id: req.params.id, cooked });
  });

  app.post("/api/recipes/:id/favorite", async (req, res) => {
    const favorite = await storage.toggleRecipeFavorite(req.params.id);
    res.json({ id: req.params.id, favorite });
  });

  app.post("/api/recipes/:id/kid-approval", async (req, res) => {
    const { tag } = req.body;
    const validTags: KidApproval[] = ["beiden", "charlie", "bodi"];
    if (!tag || !validTags.includes(tag)) {
      return res.status(400).json({ message: "Ongeldige tag" });
    }
    const kidApproval = await storage.toggleRecipeKidApproval(req.params.id, tag);
    res.json({ id: req.params.id, kidApproval });
  });

  // Update categories for a recipe
  app.patch("/api/recipes/:id/categories", async (req, res) => {
    const { categories } = req.body;
    if (!Array.isArray(categories)) {
      return res.status(400).json({ message: "Categorieën moeten een array zijn" });
    }
    const recipe = await storage.updateRecipeCategories(req.params.id, categories);
    if (!recipe) return res.status(404).json({ message: "Recept niet gevonden" });
    res.json(recipe);
  });

  app.post("/api/recipes/import-url", async (req, res) => {
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

  // Bulk import recipes from a page with multiple recipe links
  app.post("/api/recipes/import-bulk", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL is verplicht" });
    }
    try {
      const results = await bulkImportRecipes(url);
      let imported = 0;
      for (const r of results) {
        if (r.title && r.url) {
          await storage.addRecipe({
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

  // Bulk import places from a page with multiple place links
  app.post("/api/places/import-bulk", async (req, res) => {
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

  return httpServer;
}
