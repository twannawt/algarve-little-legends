import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
  Coffee,
  Moon,
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
  { key: "restaurant", labelKey: "restaurants" as const, icon: UtensilsCrossed, color: "bg-[hsl(140,20%,42%)]/10 text-[hsl(140,20%,42%)] dark:text-[hsl(140,24%,58%)]" },
  { key: "beach", labelKey: "stranden" as const, icon: Waves, color: "bg-[hsl(195,20%,55%)]/10 text-[hsl(195,20%,55%)] dark:text-[hsl(195,24%,68%)]" },
  { key: "playground", labelKey: "speeltuinen" as const, icon: TreePine, color: "bg-[hsl(95,18%,48%)]/10 text-[hsl(95,18%,48%)] dark:text-[hsl(95,22%,62%)]" },
  { key: "activity", labelKey: "activiteiten" as const, icon: Bike, color: "bg-[hsl(35,55%,65%)]/10 text-[hsl(35,55%,65%)] dark:text-[hsl(35,55%,75%)]" },
  { key: "attraction", labelKey: "attracties" as const, icon: Ticket, color: "bg-[hsl(170,18%,50%)]/10 text-[hsl(170,18%,50%)] dark:text-[hsl(170,22%,64%)]" },
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
    <div className="flex gap-3 mb-4">
      {/* Charlie */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[hsl(330,30%,96%)] dark:bg-[hsl(330,20%,14%)] border border-[hsl(330,25%,88%)] dark:border-[hsl(330,15%,22%)]">
        <div className="w-9 h-9 rounded-full bg-[hsl(330,35%,90%)] dark:bg-[hsl(330,20%,22%)] flex items-center justify-center text-lg">
          👑
        </div>
        <div className="min-w-0">
          <span className="text-sm font-semibold text-foreground">Charlie</span>
          <p className="text-xs text-muted-foreground">
            {charlie.years} jaar{charlie.months > 0 ? `, ${charlie.months} ${charlie.months === 1 ? "maand" : "maanden"}` : ""}
          </p>
        </div>
      </div>
      {/* Bodi */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[hsl(200,30%,96%)] dark:bg-[hsl(200,20%,14%)] border border-[hsl(200,25%,88%)] dark:border-[hsl(200,15%,22%)]">
        <div className="w-9 h-9 rounded-full bg-[hsl(200,35%,90%)] dark:bg-[hsl(200,20%,22%)] flex items-center justify-center text-lg">
          🐻
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

function getTimeGreeting(t: ReturnType<typeof useT>): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return t("heroOchtend");
  if (hour >= 12 && hour < 17) return t("heroMiddag");
  if (hour >= 17 && hour < 22) return t("heroAvond");
  return t("heroNacht");
}

type TimeTipData = { tip: string; action: string; icon: React.ComponentType<{ className?: string }>; color: string; onClick: () => void };

function useTimeTip(t: ReturnType<typeof useT>, navigate: (path: string) => void, setCategory: (cat: string | null) => void): TimeTipData {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return {
    tip: t("tipOchtend"),
    action: t("bekijkOntbijt"),
    icon: Coffee,
    color: "bg-[hsl(35,55%,65%)]/10 text-[hsl(35,55%,55%)] dark:text-[hsl(35,55%,75%)] border-[hsl(35,55%,65%)]/20",
    onClick: () => navigate("/recepten"),
  };
  if (hour >= 12 && hour < 17) return {
    tip: t("tipMiddag"),
    action: t("bekijkStranden"),
    icon: Waves,
    color: "bg-[hsl(195,20%,55%)]/10 text-[hsl(195,20%,45%)] dark:text-[hsl(195,20%,70%)] border-[hsl(195,20%,55%)]/20",
    onClick: () => { setCategory("beach"); document.getElementById("categories-section")?.scrollIntoView({ behavior: "smooth" }); },
  };
  if (hour >= 17 && hour < 22) return {
    tip: t("tipAvond"),
    action: t("bekijkRestaurants"),
    icon: UtensilsCrossed,
    color: "bg-[hsl(140,20%,42%)]/10 text-[hsl(140,20%,35%)] dark:text-[hsl(140,20%,65%)] border-[hsl(140,20%,42%)]/20",
    onClick: () => { setCategory("restaurant"); document.getElementById("categories-section")?.scrollIntoView({ behavior: "smooth" }); },
  };
  return {
    tip: t("tipNacht"),
    action: t("planMorgen"),
    icon: Moon,
    color: "bg-[hsl(250,20%,50%)]/10 text-[hsl(250,20%,40%)] dark:text-[hsl(250,20%,72%)] border-[hsl(250,20%,50%)]/20",
    onClick: () => navigate("/dagplanner"),
  };
}

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
  const [surpriseCategory, setSurpriseCategory] = useState<string | null>(null);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const timeTip = useTimeTip(t, navigate, setActiveCategory);
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

  const { data: recentlyViewed = [] } = useQuery<Place[]>({
    queryKey: ["/api/recently-viewed"],
    refetchOnWindowFocus: true,
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

  async function fetchRandom() {
    const url = surpriseCategory ? `/api/random?category=${surpriseCategory}` : "/api/random";
    const res = await apiRequest("GET", url);
    const place = await res.json();
    setRandomPlace(place);
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
    <div className="max-w-5xl mx-auto pb-24 md:pb-8">
      {/* Hero — compact greeting + weather */}
      <motion.section
        className="px-4 pt-5 pb-4"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold font-serif text-foreground tracking-tight">
              {getTimeGreeting(t)}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("heroSubtitle")}
            </p>
          </div>
          {weather && (
            <button
              data-testid="weather-widget"
              onClick={() => setWeatherExpanded(!weatherExpanded)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors shrink-0"
            >
              {getWeatherIcon(weather.current.weathercode, "h-5 w-5")}
              <span className="text-lg font-bold text-foreground">{Math.round(weather.current.temperature)}°</span>
            </button>
          )}
        </div>

        {/* Expandable weather forecast */}
        {weather && weatherExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-center gap-4 py-2 px-3 rounded-xl bg-card border border-border"
          >
            <p className="text-xs text-primary font-medium whitespace-nowrap">{getWeatherSuggestion(weather)}</p>
            <div className="flex gap-3 ml-auto">
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
          </motion.div>
        )}
      </motion.section>

      <div className="px-4">
        {/* Time-contextual tip */}
        {(() => {
          const { tip: tipText, action: tipAction, icon: TipIcon, color: tipColor, onClick: tipClick } = timeTip;
          return (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              data-testid="time-tip"
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border mb-4 ${tipColor}`}
            >
              <TipIcon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium flex-1">{tipText}</span>
              <button
                onClick={tipClick}
                className="text-xs font-semibold whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity"
              >
                {tipAction} →
              </button>
            </motion.div>
          );
        })()}

        {/* Quick Start — kids + action buttons */}
        <div className="mb-5">
          <KidsTracker />
          <div className="flex gap-3">
            <button
              data-testid="random-button"
              onClick={fetchRandom}
              className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-[hsl(42,35%,62%)] text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity flex-1"
            >
              <Sparkles className="h-4.5 w-4.5" />
              {t("verrasMe")}
            </button>
            <button
              data-testid="nearby-action"
              onClick={handleNearbyClick}
              className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border border-border bg-card text-foreground text-sm font-semibold shadow-sm hover:border-primary/30 transition-colors flex-1"
            >
              <MapPin className="h-4.5 w-4.5 text-primary" />
              {t("inDeBuurt")}
            </button>
          </div>
        </div>

        {/* Surprise category filter chips */}
        <div className="relative mb-4">
          <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 md:hidden" />
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categoryConfig.map(({ key, labelKey, icon: Icon }) => (
            <button
              key={key}
              data-testid={`surprise-chip-${key}`}
              onClick={() => setSurpriseCategory(surpriseCategory === key ? null : key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                surpriseCategory === key
                  ? "border-[hsl(42,35%,62%)] bg-[hsl(42,35%,62%)]/12 text-[hsl(42,30%,40%)] dark:text-[hsl(42,30%,72%)]"
                  : "border-border bg-card text-muted-foreground hover:border-[hsl(42,35%,62%)]/30"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(labelKey)}
            </button>
          ))}
        </div>
        </div>

        {/* Random Suggestion — with wow-moment */}
        <AnimatePresence>
          {randomPlace && (
            <motion.div
              ref={suggestionRef}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="mb-6"
            >
              <Card className="border-[hsl(42,30%,72%)] bg-gradient-to-br from-[hsl(42,40%,96%)] to-[hsl(42,30%,92%)] dark:border-[hsl(42,30%,25%)] dark:from-[hsl(42,25%,14%)] dark:to-[hsl(42,20%,12%)] rounded-2xl shadow-md overflow-hidden relative">
                {/* Shimmer overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_ease-in-out_1]" style={{ animationFillMode: 'forwards' }} />
                <CardContent className="p-5 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <motion.div
                        className="flex items-center gap-2 mb-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                      >
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(42,35%,62%)]/15">
                          <Sparkles className="h-3.5 w-3.5 text-[hsl(42,35%,55%)]" />
                          <span className="text-xs font-semibold text-[hsl(42,30%,42%)] dark:text-[hsl(42,30%,68%)]">{t("suggestieTekst")}</span>
                        </div>
                      </motion.div>
                      <motion.h3
                        className="text-lg font-bold text-foreground"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                      >
                        {randomPlace.name}
                      </motion.h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{randomPlace.location}</span>
                      </div>
                      <div className="mt-2.5">
                        <CategoryBadge category={randomPlace.category} />
                      </div>
                      <Button
                        data-testid="random-go"
                        variant="ghost"
                        className="px-0 mt-2.5 text-[hsl(42,30%,42%)] hover:text-[hsl(42,30%,30%)] dark:text-[hsl(42,30%,68%)] hover:bg-transparent font-semibold"
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories — horizontal scroll on mobile, grid on desktop */}
        <section id="categories-section" className="mb-6">
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

        {/* Search + Age Filters */}
        <div className="mb-6">
          <SearchBar value={search} onChange={setSearch} placeholder={t("zoekPlekken")} />
          <div className="flex gap-2 mt-3">
            {[
              { key: null, labelKey: "alleLeeftijden" as const },
              { key: "peuter", labelKey: "peuter" as const },
              { key: "kleuter", labelKey: "kleuter" as const },
            ].map(({ key, labelKey }) => (
              <button
                key={labelKey}
                data-testid={`age-filter-${key || "all"}`}
                onClick={() => setAgeFilter(ageFilter === key ? null : key)}
                className={`min-h-[44px] px-4 text-xs rounded-full border transition-all ${
                  ageFilter === key
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

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

        {/* Recent bekeken */}
        {!showResults && recentlyViewed.length > 0 && (
          <motion.section
            className="mb-8"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.25, delay: 0.1 }}
          >
            <SectionHeader>{t("recentBekeken")}</SectionHeader>
            <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible scrollbar-hide">
              {recentlyViewed.map((place) => (
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
