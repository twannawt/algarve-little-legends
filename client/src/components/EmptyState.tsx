import { Heart, Clock, ChefHat, MapPin, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: "favorites" | "recipes" | "recently-viewed" | "recipe-favorites";
}

const config = {
  "favorites": {
    icon: Heart,
    title: "Nog geen favorieten",
    description: "Tik op het hartje bij een plek om deze hier te bewaren.",
    action: null,
  },
  "recipes": {
    icon: ChefHat,
    title: "Nog geen recepten",
    description: "Voeg je eerste recept toe via de knop hierboven.",
    action: null,
  },
  "recently-viewed": {
    icon: Clock,
    title: "Nog niets bekeken",
    description: "Plekken die je bekijkt verschijnen hier automatisch.",
    action: null,
  },
  "recipe-favorites": {
    icon: Sparkles,
    title: "Nog geen favoriete recepten",
    description: "Markeer recepten als favoriet om ze hier te zien.",
    action: null,
  },
} as const;

export function EmptyState({ type }: EmptyStateProps) {
  const { icon: Icon, title, description } = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-primary/50" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-[240px]">{description}</p>
    </div>
  );
}
