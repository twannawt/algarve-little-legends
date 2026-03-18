import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MapComponent } from "@/components/MapComponent";
import { useT } from "@/lib/i18n";
import {
  UtensilsCrossed,
  Waves,
  TreePine,
  Bike,
  Ticket,
} from "lucide-react";
import type { Place } from "@shared/schema";

const categories = [
  { key: "restaurant", labelKey: "restaurants" as const, icon: UtensilsCrossed, color: "bg-[hsl(15,45%,55%)] text-white" },
  { key: "beach", labelKey: "stranden" as const, icon: Waves, color: "bg-[hsl(195,20%,55%)] text-white" },
  { key: "playground", labelKey: "speeltuinen" as const, icon: TreePine, color: "bg-[hsl(155,25%,42%)] text-white" },
  { key: "activity", labelKey: "activiteiten" as const, icon: Bike, color: "bg-[hsl(35,55%,65%)] text-white" },
  { key: "attraction", labelKey: "attracties" as const, icon: Ticket, color: "bg-[hsl(345,25%,60%)] text-white" },
] as const;

export default function MapView() {
  const [, navigate] = useLocation();
  const t = useT();
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const { data: places = [] } = useQuery<Place[]>({
    queryKey: ["/api/places"],
  });

  const filteredPlaces =
    activeFilters.size === 0
      ? places
      : places.filter((p) => activeFilters.has(p.category));

  function toggleFilter(key: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-4rem)]">
      {/* Category Filter Buttons */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-background border-b border-border">
        {categories.map(({ key, labelKey, icon: Icon, color }) => {
          const isActive = activeFilters.has(key);
          return (
            <button
              key={key}
              data-testid={`map-filter-${key}`}
              onClick={() => toggleFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
                isActive
                  ? color
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(labelKey)}
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapComponent
          places={filteredPlaces}
          onPlaceClick={(id) => navigate(`/place/${id}`)}
        />
      </div>
    </div>
  );
}
