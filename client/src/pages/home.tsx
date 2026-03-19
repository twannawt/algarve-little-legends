import { useState, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  UtensilsCrossed,
  Waves,
  Sparkles,
  MapPin,
  Navigation,
  Coffee,
  Moon,
} from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { PlaceCard } from "@/components/PlaceCard";
import { KidsTracker } from "@/components/KidsTracker";
import { WeatherWidget } from "@/components/WeatherWidget";
import { SurpriseSection, categoryConfig } from "@/components/SurpriseSection";
import { EmptyState } from "@/components/EmptyState";
import { FloatingResetButton } from "@/components/FloatingResetButton";
import { fadeIn, staggerContainer } from "@/lib/animations";
import { useT } from "@/lib/i18n";
import { getDistance, LAGOA_LAT, LAGOA_LNG } from "@/lib/geo";
import type { Place, WeatherData } from "@shared/schema";

// ── Helpers ──────────────────────────────────────────────────

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

// ── Time-contextual greeting / tips ──────────────────────────

function getTimeGreeting(t: ReturnType<typeof useT>): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return t("heroOchtend");
  if (hour >= 12 && hour < 17) return t("heroMiddag");
  if (hour >= 17 && hour < 22) return t("heroAvond");
  return t("heroNacht");
}

type TimeTipData = { tip: string; action: string; icon: React.ComponentType<{ className?: string }>; color: string; onClick: () => void };

function useTimeTip(
  t: ReturnType<typeof useT>,
  navigate: (path: string) => void,
  setCategory: (cat: string | null) => void,
  weather?: WeatherData | null,
): TimeTipData {
  const hour = new Date().getHours();
  const isRainy = weather ? weather.current.weathercode >= 51 : false;

  if (hour >= 6 && hour < 12) return {
    tip: t("tipOchtend"),
    action: t("bekijkOntbijt"),
    icon: Coffee,
    color: "bg-[hsl(35,55%,65%)]/10 text-[hsl(35,55%,55%)] dark:text-[hsl(35,55%,75%)] border-[hsl(35,55%,65%)]/20",
    onClick: () => navigate("/recepten"),
  };
  if (hour >= 12 && hour < 17) {
    if (isRainy) {
      return {
        tip: t("tipMiddagRegen"),
        action: t("bekijkActiviteiten"),
        icon: Sparkles,
        color: "bg-[hsl(195,20%,55%)]/10 text-[hsl(195,20%,45%)] dark:text-[hsl(195,20%,70%)] border-[hsl(195,20%,55%)]/20",
        onClick: () => { setCategory("activity"); document.getElementById("categories-section")?.scrollIntoView({ behavior: "smooth" }); },
      };
    }
    return {
      tip: t("tipMiddag"),
      action: t("bekijkStranden"),
      icon: Waves,
      color: "bg-[hsl(195,20%,55%)]/10 text-[hsl(195,20%,45%)] dark:text-[hsl(195,20%,70%)] border-[hsl(195,20%,55%)]/20",
      onClick: () => { setCategory("beach"); document.getElementById("categories-section")?.scrollIntoView({ behavior: "smooth" }); },
    };
  }
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

// ── Main Page ────────────────────────────────────────────────

export default function HomePage() {
  const [, navigate] = useLocation();
  const t = useT();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [ageFilter, setAgeFilter] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const nearbyRef = useRef<HTMLElement>(null);
  const { data: places = [] } = useQuery<Place[]>({
    queryKey: ["/api/places"],
  });

  const { data: categoryCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/categories"],
  });

  const { data: weather } = useQuery<WeatherData>({
    queryKey: ["/api/weather"],
  });

  const timeTip = useTimeTip(t, navigate, setActiveCategory, weather);

  const { data: recentlyViewed = [] } = useQuery<Place[]>({
    queryKey: ["/api/recently-viewed"],
    refetchOnWindowFocus: true,
  });

  const { data: favorites = [] } = useQuery<string[]>({
    queryKey: ["/api/favorites"],
  });

  // ── Performance: memoized computed values ──
  const filteredPlaces = useMemo(() =>
    places.filter((p) => {
      const matchesCategory = !activeCategory || p.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      const matchesAge = placeMatchesAge(p, ageFilter);
      return matchesCategory && matchesSearch && matchesAge;
    }),
    [places, activeCategory, search, ageFilter]
  );

  const nearbyLat = userLocation?.lat ?? LAGOA_LAT;
  const nearbyLng = userLocation?.lng ?? LAGOA_LNG;

  const nearbyPlaces = useMemo(() =>
    [...places]
      .map((p) => ({
        ...p,
        distance: getDistance(nearbyLat, nearbyLng, p.latitude, p.longitude),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6),
    [places, nearbyLat, nearbyLng]
  );

  const seasonalPlaces = useMemo(() => getSeasonalPlaces(places), [places]);
  const currentMonth = dutchMonths[new Date().getMonth()];

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
          {weather && <WeatherWidget weather={weather} />}
        </div>
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
              onClick={() => document.getElementById("surprise-section")?.scrollIntoView({ behavior: "smooth" })}
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

        {/* Surprise section — category chips + random result */}
        <div id="surprise-section">
          <SurpriseSection />
        </div>

        {/* Categories — grid */}
        <section id="categories-section" className="mb-6 scroll-mt-[10rem]">
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
                <PlaceCard key={place.id} place={place} favorites={favorites} />
              ))}
            </div>
            {filteredPlaces.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {t("geenResultaten")}
              </p>
            )}
          </section>
        )}

        {/* Seasonal Section */}
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
                  <PlaceCard place={place} favorites={favorites} />
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
                  <PlaceCard place={place} favorites={favorites} />
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Nearby Places */}
        {!showResults && (
          <motion.section
            ref={nearbyRef}
            className="mb-8 scroll-mt-[10rem]"
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
                <PlaceCard key={place.id} place={place} favorites={favorites} />
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
