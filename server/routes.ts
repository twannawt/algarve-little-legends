import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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

  app.get("/api/favorites", (_req, res) => {
    res.json(storage.getFavorites());
  });

  app.post("/api/favorites/:id", (req, res) => {
    const isFavorite = storage.toggleFavorite(req.params.id);
    res.json({ id: req.params.id, isFavorite });
  });

  app.get("/api/random", (_req, res) => {
    res.json(storage.getRandomPlace());
  });

  app.get("/api/weather", async (_req, res) => {
    const weather = await storage.getWeather();
    if (!weather) {
      return res.status(503).json({ message: "Weather unavailable" });
    }
    res.json(weather);
  });

  app.get("/api/visited", (_req, res) => {
    res.json(storage.getVisited());
  });

  app.post("/api/visited/:id", (req, res) => {
    const isVisited = storage.toggleVisited(req.params.id);
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

  app.get("/api/places/:id/reviews", (req, res) => {
    res.json(storage.getReviews(req.params.id));
  });

  app.post("/api/places/:id/reviews", (req, res) => {
    const { rating, comment, author } = req.body;
    if (!rating || !author) {
      return res.status(400).json({ message: "Rating en naam zijn verplicht" });
    }
    const review = storage.addReview(req.params.id, { rating, comment: comment || "", author });
    res.json(review);
  });

  return httpServer;
}
