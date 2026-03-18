import { UtensilsCrossed, Waves, TreePine, Bike, Ticket } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { Place } from "@shared/schema";

const iconMap: Record<Place["category"], React.ComponentType<{ className?: string }>> = {
  restaurant: UtensilsCrossed,
  beach: Waves,
  playground: TreePine,
  activity: Bike,
  attraction: Ticket,
};

const colorMap: Record<Place["category"], string> = {
  restaurant: "text-[hsl(15,45%,55%)]",
  beach: "text-[hsl(195,20%,55%)]",
  playground: "text-[hsl(155,25%,42%)]",
  activity: "text-[hsl(35,55%,65%)]",
  attraction: "text-[hsl(345,25%,60%)]",
};

const bgColorMap: Record<Place["category"], string> = {
  restaurant: "bg-[hsl(15,45%,55%)]/10",
  beach: "bg-[hsl(195,20%,55%)]/10",
  playground: "bg-[hsl(155,25%,42%)]/10",
  activity: "bg-[hsl(35,55%,65%)]/10",
  attraction: "bg-[hsl(345,25%,60%)]/10",
};

const labelKeyMap: Record<Place["category"], "restaurant" | "strand" | "speeltuin" | "activiteit" | "attractie"> = {
  restaurant: "restaurant",
  beach: "strand",
  playground: "speeltuin",
  activity: "activiteit",
  attraction: "attractie",
};

export function CategoryIcon({
  category,
  className = "h-5 w-5",
}: {
  category: Place["category"];
  className?: string;
}) {
  const Icon = iconMap[category];
  return <Icon className={`${className} ${colorMap[category]}`} />;
}

export function CategoryBadge({ category }: { category: Place["category"] }) {
  const t = useT();
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bgColorMap[category]} ${colorMap[category]}`}
    >
      {t(labelKeyMap[category])}
    </span>
  );
}

export function getCategoryColor(category: Place["category"]): string {
  return colorMap[category];
}

export function getCategoryBgColor(category: Place["category"]): string {
  return bgColorMap[category];
}

export { iconMap, colorMap, bgColorMap, labelKeyMap };
