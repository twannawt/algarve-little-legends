import { useState, useRef } from "react";
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
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge } from "@/components/CategoryIcon";
import { apiRequest } from "@/lib/queryClient";
import { useT } from "@/lib/i18n";
import { popIn } from "@/lib/animations";
import type { Place } from "@shared/schema";

export const categoryConfig = [
  { key: "restaurant", labelKey: "restaurants" as const, icon: UtensilsCrossed, color: "bg-[hsl(140,20%,42%)]/10 text-[hsl(140,20%,42%)] dark:text-[hsl(140,24%,58%)]" },
  { key: "beach", labelKey: "stranden" as const, icon: Waves, color: "bg-[hsl(195,20%,55%)]/10 text-[hsl(195,20%,55%)] dark:text-[hsl(195,24%,68%)]" },
  { key: "playground", labelKey: "speeltuinen" as const, icon: TreePine, color: "bg-[hsl(95,18%,48%)]/10 text-[hsl(95,18%,48%)] dark:text-[hsl(95,22%,62%)]" },
  { key: "activity", labelKey: "activiteiten" as const, icon: Bike, color: "bg-[hsl(35,55%,65%)]/10 text-[hsl(35,55%,65%)] dark:text-[hsl(35,55%,75%)]" },
  { key: "attraction", labelKey: "attracties" as const, icon: Ticket, color: "bg-[hsl(170,18%,50%)]/10 text-[hsl(170,18%,50%)] dark:text-[hsl(170,22%,64%)]" },
] as const;

export function SurpriseSection() {
  const [, navigate] = useLocation();
  const t = useT();
  const [surpriseCategory, setSurpriseCategory] = useState<string | null>(null);
  const [randomPlace, setRandomPlace] = useState<Place | null>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  async function fetchRandom() {
    const url = surpriseCategory ? `/api/random?category=${surpriseCategory}` : "/api/random";
    try {
      const res = await apiRequest("GET", url);
      const place = await res.json();
      setRandomPlace(place);
      setTimeout(() => {
        suggestionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } catch {
      // API returned 404 or error — no places found
      setRandomPlace(null);
    }
  }

  return (
    <>
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
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={popIn}
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
    </>
  );
}
