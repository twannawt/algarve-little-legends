/**
 * URL Import — extracts place info from Google Maps, website, and Instagram URLs.
 * No external AI API needed; uses URL parsing and HTML metadata extraction.
 */

import type { UrlImportResult, Place, RecipeImportResult } from "@shared/schema";

// ============================================================
// Google Maps URL parsing
// ============================================================

interface GoogleMapsData {
  name: string;
  latitude: number;
  longitude: number;
  location: string;
}

function parseGoogleMapsUrl(url: string): GoogleMapsData | null {
  try {
    // Format: https://maps.google.com/maps/place/Place+Name/@lat,lng,...
    // Format: https://www.google.com/maps/place/Place+Name/@lat,lng,...
    // Format: https://goo.gl/maps/xxx (short link — can't parse directly)
    // Format: https://maps.app.goo.gl/xxx (short link)

    const placeMatch = url.match(/\/place\/([^/@]+)/);
    const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

    let name = "";
    let latitude = 0;
    let longitude = 0;

    if (placeMatch) {
      name = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    }

    if (coordMatch) {
      latitude = parseFloat(coordMatch[1]);
      longitude = parseFloat(coordMatch[2]);
    }

    // Try to extract location from URL path
    // Often the URL has address info after the place name
    let location = "";
    if (latitude && longitude) {
      // Rough region detection for Algarve
      location = guessAlgarveLocation(latitude, longitude);
    }

    if (name || (latitude && longitude)) {
      return { name, latitude, longitude, location };
    }
    return null;
  } catch {
    return null;
  }
}

function guessAlgarveLocation(lat: number, lng: number): string {
  // Approximate town locations in the Algarve (west to east)
  const towns = [
    { name: "Sagres", lat: 37.01, lng: -8.94 },
    { name: "Vila do Bispo", lat: 37.08, lng: -8.91 },
    { name: "Aljezur", lat: 37.31, lng: -8.80 },
    { name: "Lagos", lat: 37.10, lng: -8.67 },
    { name: "Burgau", lat: 37.07, lng: -8.77 },
    { name: "Praia da Luz", lat: 37.09, lng: -8.73 },
    { name: "Portimão", lat: 37.14, lng: -8.54 },
    { name: "Ferragudo", lat: 37.12, lng: -8.52 },
    { name: "Carvoeiro", lat: 37.10, lng: -8.47 },
    { name: "Lagoa", lat: 37.14, lng: -8.45 },
    { name: "Silves", lat: 37.19, lng: -8.44 },
    { name: "Armação de Pêra", lat: 37.10, lng: -8.36 },
    { name: "Albufeira", lat: 37.09, lng: -8.25 },
    { name: "Vilamoura", lat: 37.08, lng: -8.12 },
    { name: "Quarteira", lat: 37.07, lng: -8.10 },
    { name: "Almancil", lat: 37.08, lng: -8.03 },
    { name: "Loulé", lat: 37.14, lng: -8.02 },
    { name: "Faro", lat: 37.02, lng: -7.93 },
    { name: "Olhão", lat: 37.03, lng: -7.84 },
    { name: "Tavira", lat: 37.13, lng: -7.65 },
    { name: "Monchique", lat: 37.32, lng: -8.55 },
    { name: "Alte", lat: 37.23, lng: -8.17 },
    { name: "Castro Marim", lat: 37.22, lng: -7.44 },
    { name: "Quinta do Lago", lat: 37.04, lng: -8.03 },
    { name: "Vale do Lobo", lat: 37.04, lng: -8.07 },
    { name: "Alvor", lat: 37.13, lng: -8.60 },
  ];

  let closest = towns[0];
  let minDist = Infinity;
  for (const town of towns) {
    const d = Math.sqrt(
      Math.pow(lat - town.lat, 2) + Math.pow(lng - town.lng, 2)
    );
    if (d < minDist) {
      minDist = d;
      closest = town;
    }
  }
  return closest.name;
}

// ============================================================
// Website metadata extraction
// ============================================================

interface WebMeta {
  title: string;
  description: string;
  image: string;
  siteName: string;
}

async function fetchWebMeta(url: string): Promise<WebMeta> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AlgarveLittleLegends/1.0)",
        Accept: "text/html",
      },
    });
    clearTimeout(timeout);

    const html = await res.text();

    const getMetaContent = (html: string, property: string): string => {
      // Try og: tags first, then name= tags
      const ogMatch = html.match(
        new RegExp(
          `<meta[^>]+(?:property|name)=["'](?:og:)?${property}["'][^>]+content=["']([^"']+)["']`,
          "i"
        )
      );
      if (ogMatch) return ogMatch[1];
      // Reverse order: content first
      const revMatch = html.match(
        new RegExp(
          `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:)?${property}["']`,
          "i"
        )
      );
      if (revMatch) return revMatch[1];
      return "";
    };

    const title =
      getMetaContent(html, "title") ||
      (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim();
    const description = getMetaContent(html, "description");
    const image = getMetaContent(html, "image");
    const siteName = getMetaContent(html, "site_name");

    return { title, description, image, siteName };
  } catch {
    return { title: "", description: "", image: "", siteName: "" };
  }
}

// ============================================================
// Instagram URL parsing
// ============================================================

function parseInstagramUrl(url: string): { username: string; postId: string } {
  // https://www.instagram.com/username/
  // https://www.instagram.com/p/POST_ID/
  // https://www.instagram.com/reel/REEL_ID/
  const usernameMatch = url.match(
    /instagram\.com\/(?!p\/|reel\/|explore\/)([a-zA-Z0-9_.]+)/
  );
  const postMatch = url.match(/instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/);

  return {
    username: usernameMatch ? usernameMatch[1] : "",
    postId: postMatch ? postMatch[1] : "",
  };
}

// ============================================================
// Guess category from text
// ============================================================

function guessCategory(
  text: string
): Place["category"] {
  const t = text.toLowerCase();
  if (
    /restaurant|café|cafe|eetcafé|pizzeria|bistro|brasserie|kitchen|diner|dining|eatery|food|menu|keuken|eten/.test(
      t
    )
  )
    return "restaurant";
  if (/praia|beach|strand|bay|baai/.test(t)) return "beach";
  if (/speeltuin|playground|parque infantil|kids.?play/.test(t))
    return "playground";
  if (
    /waterpark|zoo|dierentuin|museum|castle|kasteel|fort|kerk|church|monument/.test(
      t
    )
  )
    return "attraction";
  if (
    /surf|kayak|kajak|golf|mini.?golf|hik|wander|fiets|bike|riding|paard/.test(
      t
    )
  )
    return "activity";
  return "attraction";
}

// ============================================================
// Main import function
// ============================================================

export async function importFromUrls(
  googleMapsUrl: string,
  websiteUrl: string,
  instagramUrl: string
): Promise<UrlImportResult> {
  const result: UrlImportResult = {
    name: "",
    location: "",
    category: "attraction",
    description: "",
    latitude: 0,
    longitude: 0,
    website: "",
    googleMapsUrl: googleMapsUrl || "",
    instagramUrl: instagramUrl || "",
    imageUrl: "",
  };

  // 1. Parse Google Maps URL (most reliable for name + coords)
  if (googleMapsUrl) {
    // If it's a short URL, try to resolve it
    let resolvedUrl = googleMapsUrl;
    if (
      googleMapsUrl.includes("goo.gl") ||
      googleMapsUrl.includes("maps.app")
    ) {
      try {
        const res = await fetch(googleMapsUrl, {
          redirect: "follow",
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        resolvedUrl = res.url;
      } catch {
        // keep original
      }
    }

    const mapsData = parseGoogleMapsUrl(resolvedUrl);
    if (mapsData) {
      result.name = mapsData.name;
      result.latitude = mapsData.latitude;
      result.longitude = mapsData.longitude;
      result.location = mapsData.location;
    }
  }

  // 2. Fetch website metadata
  if (websiteUrl) {
    result.website = websiteUrl;
    const meta = await fetchWebMeta(websiteUrl);
    // Decode HTML entities
    const decodeHtml = (s: string) =>
      s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
    if (!result.name && meta.title) {
      result.name = decodeHtml(meta.title)
        .replace(/^(home|inicio|welkom)\s*[-|–—]\s*/i, "")
        .replace(/\s*[-|–—]\s*(home|official|website|algarve|portugal|inicio|welkom).*/i, "")
        .replace(/\s*[-|–—]\s*$/, "")
        .trim();
    }
    if (meta.description) {
      result.description = decodeHtml(meta.description).slice(0, 300);
    }
    if (meta.image) {
      result.imageUrl = meta.image.startsWith("http")
        ? meta.image
        : new URL(meta.image, websiteUrl).href;
    }
    // Guess category from website content
    result.category = guessCategory(
      `${meta.title} ${meta.description} ${meta.siteName}`
    );
  }

  // 3. Parse Instagram (username + post)
  if (instagramUrl) {
    const ig = parseInstagramUrl(instagramUrl);
    result.instagramUrl = instagramUrl;
    // If we still don't have a name, use the username
    if (!result.name && ig.username) {
      result.name = ig.username;
    }
  }

  // If we have a name from Maps but no description, generate a simple one
  if (result.name && !result.description) {
    result.description = `${result.name} in ${result.location || "de Algarve"}.`;
  }

  // If name came from maps, also guess category from that
  if (result.name && !websiteUrl) {
    result.category = guessCategory(result.name);
  }

  return result;
}

// ============================================================
// Bulk URL extraction — find links on a page
// ============================================================

export async function extractLinksFromPage(url: string): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AlgarveLittleLegends/1.0)",
        Accept: "text/html",
      },
    });
    clearTimeout(timeout);

    const html = await res.text();

    // Extract all <a href="..."> links
    const linkRegex = /<a[^>]+href=["']([^"'#][^"']*)["']/gi;
    const links: string[] = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      let href = match[1];
      // Resolve relative URLs
      if (href.startsWith("/")) {
        try {
          href = new URL(href, url).href;
        } catch { continue; }
      }
      if (href.startsWith("http")) {
        links.push(href);
      }
    }
    return [...new Set(links)];
  } catch {
    return [];
  }
}

export async function bulkImportRecipes(pageUrl: string): Promise<RecipeImportResult[]> {
  const links = await extractLinksFromPage(pageUrl);

  // Filter links that look like recipe pages (heuristic)
  const recipeLinks = links.filter((link) => {
    const lower = link.toLowerCase();
    return (
      lower.includes("recept") ||
      lower.includes("recipe") ||
      lower.includes("/r/") ||
      lower.includes("/allerhande/") ||
      lower.includes("/koken/")
    );
  }).slice(0, 20); // Limit to 20 to avoid overloading

  const results: RecipeImportResult[] = [];
  for (const link of recipeLinks) {
    try {
      const result = await importRecipeFromUrl(link);
      if (result.title) {
        results.push({ ...result, url: link });
      }
    } catch { /* skip failed imports */ }
  }
  return results;
}

export async function bulkImportPlaces(pageUrl: string): Promise<Array<{
  name: string;
  location: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  website: string;
  imageUrl: string;
}>> {
  const links = await extractLinksFromPage(pageUrl);

  // Filter links that look like Google Maps or place pages
  const placeLinks = links.filter((link) => {
    const lower = link.toLowerCase();
    return (
      lower.includes("google.com/maps") ||
      lower.includes("goo.gl/maps") ||
      lower.includes("maps.app.goo.gl")
    );
  }).slice(0, 20);

  const results: Array<{
    name: string;
    location: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    website: string;
    imageUrl: string;
  }> = [];

  for (const link of placeLinks) {
    try {
      const result = await importFromUrls(link, "", "");
      if (result.name) {
        results.push({
          name: result.name,
          location: result.location,
          category: result.category,
          description: result.description,
          latitude: result.latitude,
          longitude: result.longitude,
          website: result.website || "",
          imageUrl: result.imageUrl || "",
        });
      }
    } catch { /* skip */ }
  }

  // If no Google Maps links found, try extracting from regular page links
  if (results.length === 0) {
    // Try fetching each unique-domain link and check for place info
    const otherLinks = links
      .filter(link => !link.includes("google.com/maps"))
      .slice(0, 10);

    for (const link of otherLinks) {
      try {
        const result = await importFromUrls("", link, "");
        if (result.name && result.name.length > 2) {
          results.push({
            name: result.name,
            location: result.location || "Algarve",
            category: result.category,
            description: result.description,
            latitude: result.latitude,
            longitude: result.longitude,
            website: link,
            imageUrl: result.imageUrl || "",
          });
        }
      } catch { /* skip */ }
    }
  }

  return results;
}

// ============================================================
// Recipe URL import
// ============================================================

export async function importRecipeFromUrl(url: string): Promise<RecipeImportResult> {
  const meta = await fetchWebMeta(url);
  const decodeHtml = (s: string) =>
    s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");

  let title = "";
  if (meta.title) {
    title = decodeHtml(meta.title)
      .replace(/\s*[-|–—]\s*(recept|recipe|recepten).*/i, "")
      .replace(/\s*[-|–—]\s*(allerhande|ah|jumbo|albert heijn|leuke recepten|smulweb|lekker en simpel|24kitchen).*/i, "")
      .trim();
  }

  return {
    title,
    imageUrl: meta.image?.startsWith("http") ? meta.image : (meta.image ? new URL(meta.image, url).href : ""),
    description: meta.description ? decodeHtml(meta.description).slice(0, 300) : "",
    siteName: meta.siteName ? decodeHtml(meta.siteName) : new URL(url).hostname.replace(/^www\./, ""),
  };
}
