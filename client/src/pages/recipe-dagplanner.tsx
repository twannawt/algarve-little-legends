import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Coffee, UtensilsCrossed, RefreshCw, ExternalLink, ChefHat, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useT } from "@/lib/i18n";
import type { Recipe } from "@shared/schema";

interface RecipeDagPlan {
  ontbijt: Recipe | null;
  lunch: Recipe | null;
  diner: Recipe | null;
}

function getCategoryColor(cat: string): string {
  switch (cat) {
    case "ontbijt": return "bg-amber-50 text-amber-800/70 dark:bg-amber-900/20 dark:text-amber-300/80";
    case "lunch": return "bg-emerald-50 text-emerald-800/70 dark:bg-emerald-900/20 dark:text-emerald-300/80";
    case "diner": return "bg-stone-100 text-stone-700 dark:bg-stone-800/30 dark:text-stone-400";
    default: return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

export default function RecipeDagplannerPage() {
  const t = useT();
  const [plan, setPlan] = useState<RecipeDagPlan | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchPlan() {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/recept-dagplan");
      const data = await res.json();
      setPlan(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  // Fetch on first render
  if (!plan && !loading) {
    fetchPlan();
  }

  const steps = plan
    ? [
        {
          icon: Coffee,
          label: t("ontbijt"),
          recipe: plan.ontbijt,
          color: "bg-[hsl(35,55%,65%)]",
          lineColor: "border-[hsl(35,55%,65%)]/30",
        },
        {
          icon: UtensilsCrossed,
          label: t("lunchRecept"),
          recipe: plan.lunch,
          color: "bg-[hsl(140,20%,42%)]",
          lineColor: "border-[hsl(140,20%,42%)]/30",
        },
        {
          icon: Sun,
          label: t("diner"),
          recipe: plan.diner,
          color: "bg-[hsl(95,18%,48%)]",
          lineColor: "border-[hsl(95,18%,48%)]/30",
        },
      ]
    : [];

  return (
    <motion.div
      className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <h1 className="text-2xl font-bold font-serif text-foreground mb-1">
        {t("receptDagplanTitle")}
      </h1>
      <div className="w-8 h-0.5 bg-primary/40 rounded-full mb-1" />
      <p className="text-sm text-muted-foreground mb-6">
        {t("receptDagplanSubtitle")}
      </p>

      {loading && (
        <div className="space-y-0">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                {idx < 2 && <div className="w-0 flex-1 border-l-2 border-dashed border-muted my-1" />}
              </div>
              <div className="flex-1 pb-6">
                <div className="h-3 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="h-36 bg-muted animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-1/3 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-full bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {plan && (
        <div className="space-y-0">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="flex gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-0 flex-1 border-l-2 border-dashed ${step.lineColor} my-1`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {step.label}
                  </span>
                  {step.recipe ? (
                    <Card className="mt-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      {step.recipe.imageUrl && (
                        <a href={step.recipe.url} target="_blank" rel="noopener noreferrer">
                          <div className="relative h-36 overflow-hidden">
                            <img
                              src={step.recipe.imageUrl}
                              alt={step.recipe.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                            {/* Status indicators */}
                            <div className="absolute top-2 left-2 flex gap-1">
                              {step.recipe.cooked && (
                                <span className="bg-[hsl(42,35%,55%)] text-white rounded-full p-1.5 shadow-sm">
                                  <ChefHat className="h-3 w-3" />
                                </span>
                              )}
                              {step.recipe.favorite && (
                                <span className="bg-red-500 text-white rounded-full p-1.5 shadow-sm">
                                  <Heart className="h-3 w-3 fill-current" />
                                </span>
                              )}
                            </div>
                          </div>
                        </a>
                      )}
                      <CardContent className="p-4">
                        <a
                          href={step.recipe.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 block"
                        >
                          {step.recipe.title}
                        </a>
                        {step.recipe.siteName && (
                          <p className="text-xs text-muted-foreground mt-1">{step.recipe.siteName}</p>
                        )}
                        {step.recipe.description && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                            {step.recipe.description}
                          </p>
                        )}
                        <a
                          href={step.recipe.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {t("bekijkRecept")}
                        </a>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="mt-2 rounded-2xl shadow-sm border-dashed">
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          {t("geenReceptenVoorCategorie")}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Button
        onClick={fetchPlan}
        disabled={loading}
        className="w-full h-12 mt-2 bg-gradient-to-r from-[hsl(140,20%,42%)] to-[hsl(170,18%,50%)] text-white hover:opacity-90 shadow-sm"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
        {t("nieuwReceptDagplan")}
      </Button>
    </motion.div>
  );
}
