import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { PlaceCard } from "@/components/PlaceCard";
import { EmptyState } from "@/components/EmptyState";
import { fadeIn, staggerContainer } from "@/lib/animations";
import { useT } from "@/lib/i18n";
import type { Place } from "@shared/schema";

export default function FavoritesPage() {
  const [tab, setTab] = useState<"favorites" | "visited">("favorites");
  const t = useT();

  const { data: places = [] } = useQuery<Place[]>({
    queryKey: ["/api/places"],
  });

  const { data: favoriteIds = [] } = useQuery<string[]>({
    queryKey: ["/api/favorites"],
  });

  const { data: visitedIds = [] } = useQuery<string[]>({
    queryKey: ["/api/visited"],
  });

  const favoritePlaces = places.filter((p) => favoriteIds.includes(p.id));
  const visitedPlaces = places.filter((p) => visitedIds.includes(p.id));
  const activePlaces = tab === "favorites" ? favoritePlaces : visitedPlaces;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <h1 className="text-2xl font-bold font-serif text-foreground mb-1">{t("favBezocht")}</h1>
      <div className="w-8 h-0.5 bg-primary/40 rounded-full mb-6" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          data-testid="tab-favorites"
          onClick={() => setTab("favorites")}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            tab === "favorites"
              ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
              : "text-muted-foreground border border-border hover:border-primary/20"
          }`}
        >
          <Heart className={`h-4 w-4 ${tab === "favorites" ? "fill-primary" : ""}`} />
          {t("favorieten")} ({favoritePlaces.length})
        </button>
        <button
          data-testid="tab-visited"
          onClick={() => setTab("visited")}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            tab === "visited"
              ? "bg-accent/10 text-accent border border-accent/20 shadow-sm"
              : "text-muted-foreground border border-border hover:border-accent/20"
          }`}
        >
          <CheckCircle className={`h-4 w-4 ${tab === "visited" ? "fill-accent" : ""}`} />
          {t("bezocht")} ({visitedPlaces.length})
        </button>
      </div>

      {activePlaces.length === 0 ? (
        <EmptyState type="favorites" />
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          key={tab}
        >
          {activePlaces.map((place) => (
            <motion.div key={place.id} variants={fadeIn} transition={{ duration: 0.25 }}>
              <PlaceCard place={place} favorites={favoriteIds} />
            </motion.div>
          ))}
        </motion.div>
      )}


    </div>
  );
}
