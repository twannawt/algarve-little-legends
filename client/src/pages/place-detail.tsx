import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Clock,
  Calendar,
  Users,
  Navigation,
  Globe,
  Lightbulb,
  Tag,
  Utensils,
  CheckCircle,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge, CategoryIcon } from "@/components/CategoryIcon";
import { StarRating } from "@/components/StarRating";
import { apiRequest } from "@/lib/queryClient";
import { useT } from "@/lib/i18n";
import { getDistance, LAGOA_LAT, LAGOA_LNG } from "@/lib/geo";
import type { Place } from "@shared/schema";

function BohoWaveDivider() {
  return (
    <svg className="w-full h-3 text-border my-5" viewBox="0 0 1200 8" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 4 Q150 0 300 4 Q450 8 600 4 Q750 0 900 4 Q1050 8 1200 4" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

const categoryHeroGradient: Record<string, string> = {
  restaurant: "from-[hsl(140,20%,42%)] to-[hsl(140,20%,52%)]",
  beach: "from-[hsl(195,20%,55%)] to-[hsl(195,20%,65%)]",
  playground: "from-[hsl(95,18%,48%)] to-[hsl(95,18%,55%)]",
  activity: "from-[hsl(35,55%,65%)] to-[hsl(35,55%,75%)]",
  attraction: "from-[hsl(170,18%,50%)] to-[hsl(170,18%,58%)]",
};

/** Hero image with loading state + gradient fallback on error */
function DetailHeroImage({ src, alt, category }: { src: string; alt: string; category: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <>
      {/* Gradient background shows while loading or on error */}
      <div className={`absolute inset-0 bg-gradient-to-br ${categoryHeroGradient[category]} flex items-center justify-center`}>
        {status === "error" && (
          <CategoryIcon category={category} className="h-12 w-12 !text-white/80" />
        )}
      </div>
      {status !== "error" && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </>
  );
}

export default function PlaceDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const t = useT();

  const { data: place, isLoading } = useQuery<Place>({
    queryKey: [`/api/places/${params.id}`],
  });

  // Track recently viewed
  useEffect(() => {
    if (params.id) {
      apiRequest("POST", `/api/recently-viewed/${params.id}`).catch(() => {});
    }
  }, [params.id]);

  const { data: favorites = [] } = useQuery<string[]>({
    queryKey: ["/api/favorites"],
  });

  const { data: visitedIds = [] } = useQuery<string[]>({
    queryKey: ["/api/visited"],
  });

  const { data: ratings = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/ratings"],
  });

  const isFavorite = place ? favorites.includes(place.id) : false;
  const isVisited = place ? visitedIds.includes(place.id) : false;
  const myRating = place ? (ratings[place.id] || 0) : 0;

  const toggleFav = useMutation({
    mutationFn: () => apiRequest("POST", `/api/favorites/${params.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
  });

  const toggleVisited = useMutation({
    mutationFn: () => apiRequest("POST", `/api/visited/${params.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visited"] });
    },
  });

  const rateMutation = useMutation({
    mutationFn: (rating: number) => apiRequest("POST", `/api/ratings/${params.id}`, { rating }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ratings"] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded-2xl" />
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-32 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24 text-center">
        <p className="text-muted-foreground">{t("plekNietGevonden")}</p>
        <Button variant="ghost" className="text-primary" onClick={() => navigate("/")}>
          {t("terugNaarHome")}
        </Button>
      </div>
    );
  }

  const distance = getDistance(LAGOA_LAT, LAGOA_LNG, place.latitude, place.longitude);
  const mapsUrl = `https://www.google.com/maps?q=${place.latitude},${place.longitude}`;

  const shareText = encodeURIComponent(
    `Kijk eens naar ${place.name} in de Algarve! \u{1F334}\n\u{1F4CD} ${place.location}\n${window.location.href}`
  );
  const whatsappUrl = `https://wa.me/?text=${shareText}`;

  const infoItems = [
    { icon: Users, label: t("leeftijd"), value: place.ageRange },
    { icon: Utensils, label: t("keuken"), value: place.cuisine },
    { icon: Tag, label: t("prijs"), value: place.priceRange || place.cost },
    { icon: Tag, label: t("prijsVolwassene"), value: place.priceAdult },
    { icon: Tag, label: t("prijsKind"), value: place.priceChild },
    { icon: Clock, label: t("openingstijden"), value: place.openingHours },
    { icon: Calendar, label: t("seizoen"), value: place.season || place.bestSeason },
  ].filter((item) => item.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Hero: photo or category gradient */}
      <div className="h-[240px] relative overflow-hidden">
        {place.imageUrl ? (
          <DetailHeroImage
            src={place.imageUrl}
            alt={place.imageAlt || place.name}
            category={place.category}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${categoryHeroGradient[place.category]} flex items-center justify-center`}>
            <CategoryIcon category={place.category} className="h-12 w-12 !text-white/80" />
          </div>
        )}
        {/* Dark overlay at bottom for readability */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 via-black/15 to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-24 md:pb-8">
        {/* Back button */}
        <Button
          data-testid="back-button"
          variant="ghost"
          className="mt-4 mb-4 -ml-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("terug")}
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground tracking-tight">{place.name}</h1>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{place.location}</span>
              <span className="text-xs ml-1">· {distance.toFixed(1)} km {t("vanLagoa")}</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <CategoryBadge category={place.category} />
              {isVisited && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                  <CheckCircle className="h-3 w-3" />
                  {t("alBezocht")}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              data-testid="detail-favorite"
              onClick={() => toggleFav.mutate()}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label={isFavorite ? t("verwijderFav") : t("voegFavToe")}
            >
              <Heart
                className={`h-6 w-6 ${
                  isFavorite ? "fill-accent text-accent" : "text-muted-foreground"
                }`}
              />
            </button>
            <button
              data-testid="detail-visited"
              onClick={() => toggleVisited.mutate()}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label={isVisited ? t("markeerNietBezocht") : t("markeerBezocht")}
            >
              <CheckCircle
                className={`h-6 w-6 ${
                  isVisited ? "fill-primary text-primary" : "text-muted-foreground"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground leading-relaxed mb-2">
          {place.description}
        </p>

        {place.kidFeatures.length > 0 && <BohoWaveDivider />}

        {/* Kid Features — 2-column grid */}
        {place.kidFeatures.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold font-serif text-foreground mb-3">{t("kindvriendelijk")}</h2>
            <div className="grid grid-cols-2 gap-2">
              {place.kidFeatures.map((feature) => (
                <div
                  key={feature}
                  className="px-3 py-2 text-xs rounded-xl bg-primary/[0.06] text-primary font-medium border border-primary/10"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>
        )}

        {infoItems.length > 0 && <BohoWaveDivider />}

        {/* Info Grid */}
        {infoItems.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {infoItems.map(({ icon: Icon, label, value }) => (
              <Card key={label} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Facilities (beaches) */}
        {place.facilities && place.facilities.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold font-serif text-foreground mb-3">{t("faciliteiten")}</h2>
            <div className="flex flex-wrap gap-1.5">
              {place.facilities.map((f) => (
                <span
                  key={f}
                  className="px-2.5 py-1 text-xs rounded-full bg-secondary text-secondary-foreground"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {place.tip && <BohoWaveDivider />}

        {/* Tip Box — dashed border */}
        {place.tip && (
          <div className="mb-6 p-5 rounded-2xl border border-dashed border-accent/30 bg-accent/[0.04]">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-accent mt-0.5 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-foreground mb-1">{t("tipVoorOuders")}</h2>
                <p className="text-sm text-foreground/80 leading-relaxed">{place.tip}</p>
              </div>
            </div>
          </div>
        )}

        {/* Rating — only visible for visited places */}
        {isVisited && (
          <div className="mb-6 p-4 rounded-2xl bg-primary/[0.04] border border-primary/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {myRating > 0 ? t("jouwBeoordeling") : t("geefBeoordeling")}
              </span>
              <StarRating
                rating={myRating}
                onRate={(r) => rateMutation.mutate(r)}
              />
            </div>
          </div>
        )}

        <BohoWaveDivider />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Button
            data-testid="open-maps"
            asChild
            className="flex-1 h-12 shadow-sm"
          >
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-4 w-4 mr-2" />
              {t("openInMaps")}
            </a>
          </Button>

          {place.website && (
            <Button
              data-testid="open-website"
              variant="outline"
              asChild
              className="flex-1 h-12 shadow-sm"
            >
              <a href={place.website} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4 mr-2" />
                {t("website")}
              </a>
            </Button>
          )}

          <Button
            data-testid="share-whatsapp"
            variant="outline"
            asChild
            className="flex-1 h-12 shadow-sm border-green-500/30 text-green-600 hover:bg-green-50 hover:text-green-700"
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Send className="h-4 w-4 mr-2" />
              {t("deelOpWhatsapp")}
            </a>
          </Button>
        </div>


      </div>
    </motion.div>
  );
}
