import { useState, useEffect } from "react";
import { MapPin, Heart } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { getDistance, LAGOA_LAT, LAGOA_LNG } from "@/lib/geo";
import { CategoryBadge, CategoryIcon } from "@/components/CategoryIcon";
import { Card, CardContent } from "@/components/ui/card";
import type { Place } from "@shared/schema";

const categoryGradient: Record<string, string> = {
  restaurant: "from-[hsl(140,20%,40%)] to-[hsl(130,16%,56%)]",
  beach: "from-[hsl(195,35%,50%)] to-[hsl(185,30%,65%)]",
  playground: "from-[hsl(95,20%,46%)] to-[hsl(90,16%,55%)]",
  activity: "from-[hsl(35,60%,58%)] to-[hsl(40,55%,72%)]",
  attraction: "from-[hsl(170,22%,48%)] to-[hsl(165,16%,58%)]",
};

/** Image with loading skeleton + fallback to SVG illustration on error */
function PlaceImage({ src, alt, category }: { src: string; alt: string; category: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <>
      {status === "loading" && (
        <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradient[category]} animate-pulse`} />
      )}
      {status === "error" ? (
        <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradient[category]}`}>
          <CardIllustration category={category} />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
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

// SVG scene illustrations per category
function CardIllustration({ category }: { category: string }) {
  const common = "absolute inset-0 w-full h-full";
  switch (category) {
    case "restaurant":
      return (
        <svg className={common} viewBox="0 0 320 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {/* Table cloth pattern */}
          <defs>
            <pattern id="cloth" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <rect width="16" height="16" fill="none" />
              <rect x="0" y="0" width="8" height="8" fill="white" opacity="0.06" />
              <rect x="8" y="8" width="8" height="8" fill="white" opacity="0.06" />
            </pattern>
          </defs>
          <rect width="320" height="80" fill="url(#cloth)" />
          {/* Plate */}
          <ellipse cx="160" cy="48" rx="22" ry="14" fill="white" opacity="0.12" />
          <ellipse cx="160" cy="48" rx="16" ry="10" fill="white" opacity="0.08" />
          {/* Fork */}
          <g transform="translate(125, 28)" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.2">
            <line x1="4" y1="0" x2="4" y2="30" />
            <line x1="0" y1="0" x2="0" y2="10" />
            <line x1="8" y1="0" x2="8" y2="10" />
            <path d="M0 10 Q4 14 8 10" fill="none" />
          </g>
          {/* Knife */}
          <g transform="translate(190, 28)" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.2">
            <line x1="2" y1="0" x2="2" y2="30" />
            <path d="M2 0 Q8 5 2 14" fill="none" />
          </g>
          {/* Steam curls */}
          <g stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.15">
            <path d="M155 30 Q153 24 156 18" />
            <path d="M161 28 Q159 22 162 16" />
            <path d="M167 30 Q165 24 168 18" />
          </g>
        </svg>
      );
    case "beach":
      return (
        <svg className={common} viewBox="0 0 320 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {/* Waves */}
          <g fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.15">
            <path d="M0 55 Q40 45 80 55 Q120 65 160 55 Q200 45 240 55 Q280 65 320 55" />
            <path d="M0 62 Q40 52 80 62 Q120 72 160 62 Q200 52 240 62 Q280 72 320 62" />
            <path d="M0 69 Q40 59 80 69 Q120 79 160 69 Q200 59 240 69 Q280 79 320 69" />
          </g>
          {/* Sun */}
          <circle cx="260" cy="22" r="12" fill="white" opacity="0.12" />
          <g stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.1">
            <line x1="260" y1="5" x2="260" y2="9" />
            <line x1="275" y1="22" x2="271" y2="22" />
            <line x1="272" y1="10" x2="269" y2="13" />
            <line x1="248" y1="10" x2="251" y2="13" />
          </g>
          {/* Umbrella */}
          <g transform="translate(80, 15)" opacity="0.18">
            <line x1="12" y1="8" x2="12" y2="45" stroke="white" strokeWidth="1.5" />
            <path d="M0 8 Q12 -4 24 8" fill="white" opacity="0.5" stroke="white" strokeWidth="1" />
          </g>
          {/* Shell */}
          <g transform="translate(190, 42)" opacity="0.12">
            <path d="M0 8 Q4 0 8 8 Q12 0 16 8" fill="white" stroke="white" strokeWidth="0.8" />
          </g>
        </svg>
      );
    case "playground":
      return (
        <svg className={common} viewBox="0 0 320 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {/* Ground */}
          <path d="M0 70 Q80 60 160 68 Q240 76 320 65" stroke="white" strokeWidth="1" fill="none" opacity="0.12" />
          {/* Swing set */}
          <g transform="translate(100, 10)" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.18">
            <line x1="0" y1="0" x2="0" y2="50" />
            <line x1="40" y1="0" x2="40" y2="50" />
            <line x1="0" y1="0" x2="40" y2="0" />
            {/* Swing rope + seat */}
            <line x1="14" y1="0" x2="10" y2="38" />
            <line x1="26" y1="0" x2="30" y2="38" />
            <line x1="8" y1="38" x2="32" y2="38" />
          </g>
          {/* Slide */}
          <g transform="translate(200, 18)" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.15">
            <line x1="0" y1="0" x2="0" y2="42" />
            <path d="M0 0 Q20 0 35 42" fill="none" />
            <line x1="0" y1="42" x2="35" y2="42" />
          </g>
          {/* Trees */}
          <g opacity="0.12">
            <circle cx="50" cy="30" r="14" fill="white" />
            <line x1="50" y1="44" x2="50" y2="65" stroke="white" strokeWidth="2" />
            <circle cx="280" cy="28" r="10" fill="white" />
            <line x1="280" y1="38" x2="280" y2="60" stroke="white" strokeWidth="2" />
          </g>
        </svg>
      );
    case "activity":
      return (
        <svg className={common} viewBox="0 0 320 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {/* Path / trail */}
          <path d="M-10 65 Q60 40 120 55 Q180 70 240 45 Q300 30 330 50" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.15" />
          {/* Bike */}
          <g transform="translate(140, 25)" stroke="white" strokeWidth="1.2" fill="none" opacity="0.2">
            <circle cx="0" cy="22" r="10" />
            <circle cx="30" cy="22" r="10" />
            <line x1="0" y1="22" x2="12" y2="8" />
            <line x1="12" y1="8" x2="18" y2="8" />
            <line x1="18" y1="8" x2="30" y2="22" />
            <line x1="12" y1="8" x2="15" y2="22" />
            <line x1="15" y1="22" x2="30" y2="22" />
            <circle cx="18" cy="5" r="3" fill="white" opacity="0.3" />
          </g>
          {/* Mountains in bg */}
          <g fill="white" opacity="0.08">
            <path d="M40 70 L70 20 L100 70Z" />
            <path d="M80 70 L120 10 L160 70Z" />
            <path d="M220 70 L260 25 L300 70Z" />
          </g>
          {/* Birds */}
          <g stroke="white" strokeWidth="1" fill="none" opacity="0.15" strokeLinecap="round">
            <path d="M60 20 Q65 15 70 20" />
            <path d="M75 15 Q80 10 85 15" />
            <path d="M250 18 Q255 13 260 18" />
          </g>
        </svg>
      );
    case "attraction":
      return (
        <svg className={common} viewBox="0 0 320 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {/* Ferris wheel */}
          <g transform="translate(160, 40)" stroke="white" strokeWidth="1" fill="none" opacity="0.15">
            <circle cx="0" cy="0" r="28" />
            <circle cx="0" cy="0" r="4" fill="white" opacity="0.2" />
            <line x1="0" y1="-28" x2="0" y2="28" />
            <line x1="-28" y1="0" x2="28" y2="0" />
            <line x1="-20" y1="-20" x2="20" y2="20" />
            <line x1="20" y1="-20" x2="-20" y2="20" />
            {/* Gondolas */}
            <circle cx="0" cy="-28" r="4" fill="white" opacity="0.2" />
            <circle cx="0" cy="28" r="4" fill="white" opacity="0.2" />
            <circle cx="-28" cy="0" r="4" fill="white" opacity="0.2" />
            <circle cx="28" cy="0" r="4" fill="white" opacity="0.2" />
          </g>
          {/* Stand */}
          <line x1="160" y1="68" x2="145" y2="80" stroke="white" strokeWidth="1.5" opacity="0.12" />
          <line x1="160" y1="68" x2="175" y2="80" stroke="white" strokeWidth="1.5" opacity="0.12" />
          {/* Stars / sparkles */}
          <g fill="white" opacity="0.18">
            <circle cx="50" cy="20" r="1.5" />
            <circle cx="80" cy="35" r="1" />
            <circle cx="260" cy="18" r="1.5" />
            <circle cx="290" cy="40" r="1" />
            <circle cx="40" cy="55" r="1" />
          </g>
          {/* Ticket */}
          <g transform="translate(60, 30)" opacity="0.12">
            <rect x="0" y="0" width="20" height="14" rx="2" fill="white" />
            <line x1="7" y1="0" x2="7" y2="14" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 1" opacity="0.3" />
          </g>
        </svg>
      );
    default:
      return null;
  }
}

export function PlaceCard({ place }: { place: Place }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.matchMedia("(hover: none)").matches);
  }, []);

  const { data: favorites = [] } = useQuery<string[]>({
    queryKey: ["/api/favorites"],
  });

  const isFavorite = favorites.includes(place.id);
  const distance = getDistance(LAGOA_LAT, LAGOA_LNG, place.latitude, place.longitude);

  const toggleFav = useMutation({
    mutationFn: () => apiRequest("POST", `/api/favorites/${place.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
  });

  const x = useMotionValue(0);
  const heartOpacity = useTransform(x, [-100, -40, 0], [1, 0.5, 0]);
  const heartScale = useTransform(x, [-100, -40, 0], [1.2, 0.8, 0.5]);

  function handleDragEnd(_: any, info: { offset: { x: number } }) {
    if (info.offset.x < -80) {
      toggleFav.mutate();
    }
  }

  const cardContent = (
    <Card
      data-testid={`place-card-${place.id}`}
      className="cursor-pointer rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      onClick={() => navigate(`/place/${place.id}`)}
    >
      {/* Photo or illustrated category header */}
      <div className={`h-28 relative overflow-hidden`}>
        {place.imageUrl ? (
          <PlaceImage
            src={place.imageUrl}
            alt={place.imageAlt || place.name}
            category={place.category}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradient[place.category]}`}>
            <CardIllustration category={place.category} />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="mb-1">
              <CategoryBadge category={place.category} />
            </div>
            <h3 className="font-semibold text-foreground truncate">{place.name}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{place.location}</span>
              <span>· {distance.toFixed(1)} km</span>
            </div>
          </div>
          <button
            data-testid={`favorite-${place.id}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleFav.mutate();
            }}
            className="shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors"
            aria-label={isFavorite ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
          >
            <Heart
              className={`h-5 w-5 ${
                isFavorite ? "fill-accent text-accent" : "text-muted-foreground"
              }`}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );

  if (!isMobile) return cardContent;

  // Swipe-to-favorite on mobile
  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Reveal heart behind */}
      <motion.div
        className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-accent/10 rounded-r-2xl"
        style={{ opacity: heartOpacity }}
      >
        <motion.div style={{ scale: heartScale }}>
          <Heart className={`h-8 w-8 ${isFavorite ? "fill-accent text-accent" : "text-accent"}`} />
        </motion.div>
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
      >
        {cardContent}
      </motion.div>
    </div>
  );
}
