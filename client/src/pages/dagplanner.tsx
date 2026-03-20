import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { UtensilsCrossed, Bike, TreePine, MapPin, Navigation, RefreshCw, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge } from "@/components/CategoryIcon";

import { apiRequest } from "@/lib/queryClient";
import { useT } from "@/lib/i18n";
import type { Place } from "@shared/schema";

interface DagPlan {
  restaurant: Place;
  activity: Place;
  playground: Place;
}

export default function DagplannerPage() {
  const [, navigate] = useLocation();
  const t = useT();
  const [plan, setPlan] = useState<DagPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function fetchPlan() {
    setLoading(true);
    try {
      setHasError(false);
      const res = await apiRequest("GET", "/api/dagplan");
      const data = await res.json();
      setPlan(data);
    } catch {
      setHasError(true);
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
          icon: UtensilsCrossed,
          label: t("lunch"),
          place: plan.restaurant,
          color: "bg-[hsl(140,20%,42%)]",
          lineColor: "border-[hsl(140,20%,42%)]/30",
        },
        {
          icon: Bike,
          label: t("middagActiviteit"),
          place: plan.activity,
          color: "bg-[hsl(35,55%,65%)]",
          lineColor: "border-[hsl(35,55%,65%)]/30",
        },
        {
          icon: TreePine,
          label: t("buitenSpelen"),
          place: plan.playground,
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
        {t("dagplannerTitle")}
      </h1>
      <div className="w-8 h-0.5 bg-primary/40 rounded-full mb-1" />
      <p className="text-sm text-muted-foreground mb-6">
        {t("dagplannerSubtitle")}
      </p>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        </div>
      )}

      {!plan && !loading && hasError && (
        <motion.div
          className="flex flex-col items-center justify-center py-16 px-6 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
            <Compass className="h-10 w-10 text-primary/60" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {t("geenPlannen") || "Nog geen plannen voor vandaag"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            {t("dagplannerLeeg") || "Laat ons een leuke dag samenstellen met een restaurant, activiteit en speeltuin!"}
          </p>
          <Button
            onClick={fetchPlan}
            className="bg-[hsl(42,35%,62%)] text-white hover:opacity-90 shadow-sm px-6"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t("genereerDagplan") || "Stel mijn dag samen"}
          </Button>
        </motion.div>
      )}

      {plan && (
        <AnimatePresence mode="wait">
        <motion.div
          key={`${plan.restaurant.id}-${plan.activity.id}-${plan.playground.id}`}
          className="space-y-0"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }}
        >
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const mapsUrl = `https://www.google.com/maps?q=${step.place.latitude},${step.place.longitude}`;
            return (
              <motion.div
                key={idx}
                className="flex gap-4"
                variants={{
                  hidden: { opacity: 0, y: 12, scale: 0.97 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
                }}
              >
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
                  <Card
                    className="mt-2 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/place/${step.place.id}`)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground">{step.place.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{step.place.location}</span>
                      </div>
                      <div className="mt-2">
                        <CategoryBadge category={step.place.category} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {step.place.description}
                      </p>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                      >
                        <Navigation className="h-3 w-3" />
                        Google Maps
                      </a>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        </AnimatePresence>
      )}

      <Button
        onClick={fetchPlan}
        disabled={loading}
        className="w-full h-12 mt-2 bg-gradient-to-r from-[hsl(140,20%,42%)] to-[hsl(170,18%,50%)] text-white hover:opacity-90 shadow-sm"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
        {t("nieuwDagplan")}
      </Button>


    </motion.div>
  );
}
