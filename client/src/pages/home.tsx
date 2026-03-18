import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  UtensilsCrossed,
  Waves,
  TreePine,
  Bike,
  Ticket,
  Sparkles,
  MapPin,
  X,
  ArrowRight,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  Navigation,
  User,
  Baby,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchBar } from "@/components/SearchBar";
import { PlaceCard } from "@/components/PlaceCard";
import { CategoryBadge } from "@/components/CategoryIcon";

import { apiRequest } from "@/lib/queryClient";
import { useT } from "@/lib/i18n";
import { getDistance, LAGOA_LAT, LAGOA_LNG } from "@/lib/geo";
import type { Place, WeatherData } from "@shared/schema";
import { FloatingResetButton } from "@/components/FloatingResetButton";

const categoryConfig = [
  { key: "restaurant", labelKey: "restaurants" as const, icon: UtensilsCrossed, color: "bg-[hsl(140,20%,42%)]/10 text-[hsl(140,20%,42%)]" },
  { key: "beach", labelKey: "stranden" as const, icon: Waves, color: "bg-[hsl(195,20%,55%)]/10 text-[hsl(195,20%,55%)]" },
  { key: "playground", labelKey: "speeltuinen" as const, icon: TreePine, color: "bg-[hsl(95,18%,48%)]/10 text-[hsl(95,18%,48%)]" },
  { key: "activity", labelKey: "activiteiten" as const, icon: Bike, color: "bg-[hsl(35,55%,65%)]/10 text-[hsl(35,55%,65%)]" },
  { key: "attraction", labelKey: "attracties" as const, icon: Ticket, color: "bg-[hsl(170,18%,50%)]/10 text-[hsl(170,18%,50%)]" },
] as const;

function getWeatherIcon(code: number, size = "h-5 w-5"): React.ReactNode {
  if (code <= 1) return <Sun className={`${size} text-amber-500`} />;
  if (code <= 3) return <Cloud className={`${size} text-gray-400`} />;
  if (code <= 48) return <CloudFog className={`${size} text-gray-400`} />;
  if (code <= 57) return <CloudDrizzle className={`${size} text-blue-400`} />;
  if (code <= 67) return <CloudRain className={`${size} text-blue-500`} />;
  if (code <= 77) return <CloudSnow className={`${size} text-blue-200`} />;
  if (code <= 82) return <CloudRain className={`${size} text-blue-600`} />;
  if (code <= 99) return <CloudLightning className={`${size} text-yellow-500`} />;
  return <Cloud className={size} />;
}

function useWeatherLabel() {
  const t = useT();
  return (code: number): string => {
    if (code <= 1) return t("zonnig");
    if (code <= 3) return t("bewolkt");
    if (code <= 48) return t("mistig");
    if (code <= 57) return t("motregen");
    if (code <= 67) return t("regen");
    if (code <= 77) return t("sneeuw");
    if (code <= 82) return t("buien");
    if (code <= 99) return t("onweer");
    return "";
  };
}

function useWeatherSuggestion() {
  const t = useT();
  return (weather: WeatherData): string => {
    const { temperature, weathercode } = weather.current;
    if (weathercode < 3 && temperature > 25) return t("perfectStrandweer");
    if (weathercode < 3 && temperature > 15) return t("heerlijkWeer");
    if (weathercode >= 51) return t("binnenactiviteit");
    if (temperature < 15) return t("fris");
    return t("lekkerWeer");
  };
}

function getWeatherRecommendation(weather: WeatherData, places: Place[]): Place | null {
  const { temperature, weathercode } = weather.current;
  if (weathercode < 3 && temperature > 25) {
    const beaches = places.filter((p) => p.category === "beach");
    return beaches[Math.floor(Math.random() * beaches.length)] || null;
  }
  if (weathercode >= 51) {
    const indoor = places.filter((p) => p.category === "attraction" || p.category === "activity");
    return indoor[Math.floor(Math.random() * indoor.length)] || null;
  }
  const playgrounds = places.filter((p) => p.category === "playground");
  return playgrounds[Math.floor(Math.random() * playgrounds.length)] || null;
}

function parseMinAge(ageRange: string): number {
  if (!ageRange) return 0;
  const lower = ageRange.toLowerCase();
  if (lower.includes("alle") || lower === "") return 0;
  const rangeMatch = lower.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (rangeMatch) return parseInt(rangeMatch[1], 10);
  const plusMatch = lower.match(/(\d+)\s*\+/);
  if (plusMatch) return parseInt(plusMatch[1], 10);
  const numMatch = lower.match(/(\d+)/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return 0;
}

function placeMatchesAge(place: Place, ageFilter: string | null): boolean {
  if (!ageFilter) return true;
  const minAge = parseMinAge(place.ageRange);
  if (ageFilter === "peuter") return minAge <= 3;
  if (ageFilter === "kleuter") return minAge <= 6;
  return true;
}

const dutchMonths = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

function placeMatchesSeason(place: Place): boolean {
  const seasonField = (place.season || place.bestSeason || "").toLowerCase();
  if (!seasonField || seasonField.includes("year-round") || seasonField.includes("alle") || seasonField.includes("heel het jaar")) return true;
  const season = getCurrentSeason();
  const seasonAliases: Record<string, string[]> = {
    spring: ["lente", "spring", "voorjaar", "maart", "april", "mei"],
    summer: ["zomer", "summer", "juni", "juli", "augustus"],
    autumn: ["herfst", "autumn", "september", "oktober", "november"],
    winter: ["winter", "december", "januari", "februari"],
  };
  return seasonAliases[season]?.some((alias) => seasonField.includes(alias)) ?? true;
}

function getSeasonalPlaces(places: Place[]): Place[] {
  return places.filter((p) => {
    const seasonField = (p.season || p.bestSeason || "").toLowerCase();
    if (!seasonField) return false;
    return placeMatchesSeason(p);
  }).slice(0, 6);
}

function getAge(birthDate: Date): { years: number; months: number; days: number } {
  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  let days = now.getDate() - birthDate.getDate();
  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days };
}

function KidsTracker() {
  const [, setTick] = useState(0);

  // Update once per day at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    const timeout = setTimeout(() => {
      setTick((t) => t + 1);
    }, msUntilMidnight);
    return () => clearTimeout(timeout);
  });

  const charlie = getAge(new Date(2020, 7, 18)); // 18 aug 2020
  const bodi = getAge(new Date(2024, 4, 10));     // 10 mei 2024

  return (
    <div className="flex gap-3 mb-5">
      {/* Charlie */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[hsl(170,18%,95%)] dark:bg-[hsl(170,18%,15%)] border border-[hsl(170,18%,85%)] dark:border-[hsl(170,15%,25%)]">
        <div className="w-8 h-8 rounded-full bg-[hsl(170,18%,85%)] dark:bg-[hsl(170,15%,25%)] flex items-center justify-center">
          <User className="h-4 w-4 text-[hsl(170,18%,48%)]" />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-semibold text-foreground">Charlie</span>
          <p className="text-xs text-muted-foreground">
            {charlie.years} jaar{charlie.months > 0 ? `, ${charlie.months} ${charlie.months === 1 ? "maand" : "maanden"}` : ""}
          </p>
        </div>
      </div>
      {/* Bodi */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[hsl(210,30%,95%)] dark:bg-[hsl(210,20%,15%)] border border-[hsl(210,25%,85%)] dark:border-[hsl(210,15%,25%)]">
        <div className="w-8 h-8 rounded-full bg-[hsl(210,25%,85%)] dark:bg-[hsl(210,15%,25%)] flex items-center justify-center">
          <Baby className="h-4 w-4 text-[hsl(210,25%,55%)]" />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-semibold text-foreground">Bodi</span>
          <p className="text-xs text-muted-foreground">
            {bodi.years} jaar{bodi.months > 0 ? `, ${bodi.months} ${bodi.months === 1 ? "maand" : "maanden"}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold font-serif text-foreground">{children}</h2>
      <div className="w-8 h-0.5 bg-primary/40 rounded-full mt-1" />
    </div>
  );
}

export default function HomePage() {
  const [, navigate] = useLocation();
  const t = useT();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [randomPlace, setRandomPlace] = useState<Place | null>(null);
  const [ageFilter, setAgeFilter] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const nearbyRef = useRef<HTMLElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: places = [] } = useQuery<Place[]>({
    queryKey: ["/api/places"],
  });

  const { data: categoryCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/categories"],
  });

  const { data: weather } = useQuery<WeatherData>({
    queryKey: ["/api/weather"],
  });

  const getWeatherLabel = useWeatherLabel();
  const getWeatherSuggestion = useWeatherSuggestion();

  const filteredPlaces = places.filter((p) => {
    const matchesCategory = !activeCategory || p.category === activeCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    const matchesAge = placeMatchesAge(p, ageFilter);
    return matchesCategory && matchesSearch && matchesAge;
  });

  const nearbyLat = userLocation?.lat ?? LAGOA_LAT;
  const nearbyLng = userLocation?.lng ?? LAGOA_LNG;

  const nearbyPlaces = [...places]
    .map((p) => ({
      ...p,
      distance: getDistance(nearbyLat, nearbyLng, p.latitude, p.longitude),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6);

  const seasonalPlaces = getSeasonalPlaces(places);
  const currentMonth = dutchMonths[new Date().getMonth()];

  const weatherRec = weather ? getWeatherRecommendation(weather, places) : null;

  async function fetchRandom() {
    const res = await apiRequest("GET", "/api/random");
    const place = await res.json();
    setRandomPlace(place);
    // Scroll to suggestion card after render
    setTimeout(() => {
      suggestionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  function handleNearbyClick() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsActive(true);
          nearbyRef.current?.scrollIntoView({ behavior: "smooth" });
        },
        () => {
          nearbyRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      );
    } else {
      nearbyRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  const showResults = search || activeCategory || ageFilter;

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Hero + Weather */}
      <motion.section
        className="px-4 pt-6 pb-6 bg-gradient-to-b from-primary/5 via-transparent to-transparent"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-2xl font-bold font-serif text-foreground tracking-tight">
          {t("heroTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("heroSubtitle")}
        </p>

        {weather && (
          <div data-testid="weather-widget" className="mt-4 flex items-center gap-3">
            {getWeatherIcon(weather.current.weathercode, "h-8 w-8")}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{Math.round(weather.current.temperature)}°</span>
                <span className="text-sm text-muted-foreground">{getWeatherLabel(weather.current.weathercode)}</span>
              </div>
              <p className="text-xs text-primary font-medium">{getWeatherSuggestion(weather)}</p>
            </div>
            <div className="ml-auto flex gap-3">
              {weather.daily.map((day) => {
                const dayName = new Date(day.date).toLocaleDateString("nl-NL", { weekday: "short" });
                return (
                  <div key={day.date} className="flex flex-col items-center gap-0.5 text-xs">
                    <span className="text-muted-foreground capitalize">{dayName}</span>
                    <span className="scale-75">{getWeatherIcon(day.weathercode)}</span>
                    <span className="text-foreground font-medium">{Math.round(day.tempMax)}°</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.section>

      <div className="px-4">
        {/* Kids Age Tracker */}
        <KidsTracker />

        {/* Quick Actions */}
        <div className="flex flex-col gap-3 mb-6 sm:flex-row">
          <button
            data-testid="random-button"
            onClick={fetchRandom}
            className="flex items-center justify-center gap-2.5 px-4 py-4 rounded-2xl bg-[hsl(18,45%,58%)] text-white text-base font-semibold shadow-sm hover:opacity-90 transition-opacity sm:flex-1"
          >
            <Sparkles className="h-5 w-5" />
            {t("verrasMe")}
          </button>
          <button
            data-testid="nearby-action"
            onClick={handleNearbyClick}
            className="flex items-center justify-center gap-2.5 px-4 py-4 rounded-2xl border border-border bg-card text-foreground text-base font-semibold shadow-sm hover:border-primary/30 transition-colors sm:flex-1"
          >
            <MapPin className="h-5 w-5 text-primary" />
            {t("inDeBuurt")}
          </button>
        </div>

        {/* Random Suggestion */}
        {randomPlace && (
          <Card ref={suggestionRef} className="mb-6 border-primary/20 bg-primary/5 rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium text-accent">{t("suggestieTekst")}</span>
                  </div>
                  <h3 className="font-semibold text-foreground">{randomPlace.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3" />
                    <span>{randomPlace.location}</span>
                  </div>
                  <div className="mt-2">
                    <CategoryBadge category={randomPlace.category} />
                  </div>
                  <Button
                    data-testid="random-go"
                    variant="ghost"
                    className="px-0 mt-2 text-primary hover:text-primary/80 hover:bg-transparent"
                    onClick={() => navigate(`/place/${randomPlace.id}`)}
                  >
                    {t("bekijkDetails")}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <button
                  data-testid="random-close"
                  onClick={() => setRandomPlace(null)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weather recommendation */}
        {weather && weatherRec && !showResults && (
          <Card
            className="mb-6 rounded-2xl border-accent/20 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
            onClick={() => navigate(`/place/${weatherRec.id}`)}
          >
            {/* Weather-themed banner */}
            <div className="relative h-14 bg-gradient-to-r from-accent/15 via-accent/8 to-primary/10 flex items-center gap-3 px-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-background/60 backdrop-blur-sm">
                {getWeatherIcon(weather.current.weathercode, "h-5 w-5")}
              </div>
              <div>
                <span className="text-sm font-semibold text-accent">{t("tipVanHetWeer")}</span>
                <p className="text-[11px] text-muted-foreground">
                  {Math.round(weather.current.temperature)}° — {getWeatherLabel(weather.current.weathercode)}
                </p>
              </div>
            </div>
            <CardContent className="p-4 pt-3">
              <h3 className="font-semibold text-foreground">{weatherRec.name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                <span>{weatherRec.location}</span>
              </div>
              <div className="mt-2">
                <CategoryBadge category={weatherRec.category} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="mb-3">
          <SearchBar value={search} onChange={setSearch} placeholder={t("zoekPlekken")} />
        </div>

        {/* Age Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { key: null, labelKey: "alleLeeftijden" as const },
            { key: "peuter", labelKey: "peuter" as const },
            { key: "kleuter", labelKey: "kleuter" as const },
          ].map(({ key, labelKey }) => (
            <button
              key={labelKey}
              data-testid={`age-filter-${key || "all"}`}
              onClick={() => setAgeFilter(ageFilter === key ? null : key)}
              className={`h-8 px-3 text-xs rounded-full border transition-all ${
                ageFilter === key
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Categories — horizontal scroll on mobile, grid on desktop */}
        <section className="mb-8">
          <SectionHeader>{t("categorieen")}</SectionHeader>
          <motion.div
            className="grid grid-cols-3 gap-3 sm:grid-cols-5"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {categoryConfig.map(({ key, labelKey, icon: Icon, color }) => {
              const isActive = activeCategory === key;
              return (
                <motion.button
                  key={key}
                  data-testid={`category-${key}`}
                  variants={fadeIn}
                  transition={{ duration: 0.25 }}
                  onClick={() => setActiveCategory(isActive ? null : key)}
                  className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border shadow-sm transition-all ${
                    isActive
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className={`p-3 rounded-full ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{t(labelKey)}</span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {categoryCounts[key] || 0}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </section>

        {/* Filtered Results */}
        {showResults && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader>
                {activeCategory
                  ? t(categoryConfig.find((c) => c.key === activeCategory)?.labelKey ?? "resultaten")
                  : t("zoekresultaten")}
              </SectionHeader>
              <span className="text-sm text-muted-foreground">
                {filteredPlaces.length} {t("resultaten")}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
            {filteredPlaces.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {t("geenResultaten")}
              </p>
            )}
          </section>
        )}

        {/* Seasonal Section — warm background strip */}
        {!showResults && seasonalPlaces.length > 0 && (
          <motion.section
            className="mb-8 -mx-4 px-4 py-6 bg-primary/[0.03] rounded-none"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.25, delay: 0.1 }}
          >
            <SectionHeader>{t("watTeDoen")} {currentMonth}</SectionHeader>
            <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible scrollbar-hide">
              {seasonalPlaces.map((place) => (
                <div key={place.id} className="flex-shrink-0 w-64 md:w-auto">
                  <PlaceCard place={place} />
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Nearby Places */}
        {!showResults && (
          <motion.section
            ref={nearbyRef}
            className="mb-8"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.25, delay: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold font-serif text-foreground">
                {t("dichtbij")} {gpsActive ? "" : "Lagoa"}
              </h2>
              {gpsActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                  <Navigation className="h-3 w-3" />
                  {t("gpsActief")}
                </span>
              )}
            </div>
            <div className="w-8 h-0.5 bg-primary/40 rounded-full mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </motion.section>
        )}



      </div>

      <FloatingResetButton
        visible={!!search || !!activeCategory || !!ageFilter}
        onReset={() => {
          setSearch("");
          setActiveCategory(null);
          setAgeFilter(null);
        }}
      />
    </div>
  );
}
