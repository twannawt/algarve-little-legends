/**
 * Gedeelde constanten en helpers voor receptenpagina's.
 * Gebruikt door recipes.tsx, recipe-favorites.tsx en RecipeCard.tsx.
 */
import { KID_NAMES } from "@shared/config";
import type { RecipeCategory, RecipeDifficulty, KidApproval } from "@shared/schema";

export const categoryOptions: { key: RecipeCategory; labelKey: string }[] = [
  { key: "ontbijt", labelKey: "ontbijt" },
  { key: "lunch", labelKey: "lunchRecept" },
  { key: "diner", labelKey: "diner" },
  { key: "snack", labelKey: "snack" },
  { key: "tussendoortje", labelKey: "tussendoortje" },
  { key: "overig", labelKey: "overig" },
];

/** Derived from KID_NAMES config — no hardcoded kid names */
export const kidApprovalOptions: { key: KidApproval; labelKey: string }[] = [
  { key: "beiden", labelKey: "beiden" },
  ...KID_NAMES.map((kid) => ({
    key: kid.key as KidApproval,
    labelKey: kid.key,
  })),
];

export type SortOption = "nieuwste" | "oudste" | "az" | "za";

export const sortOptions: { key: SortOption; labelKey: string }[] = [
  { key: "nieuwste", labelKey: "nieuwsteEerst" },
  { key: "oudste", labelKey: "oudsteEerst" },
  { key: "az", labelKey: "alfabetisch" },
  { key: "za", labelKey: "alfabetischOmgekeerd" },
];

export const filterOptions = [
  { key: "all", labelKey: "alleRecepten" },
  { key: "uncooked", labelKey: "nogNietGemaakt" },
] as const;

export const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

/** Bali Green + Warm Terracotta palette for category badges */
export function getCategoryColor(cat: RecipeCategory): string {
  switch (cat) {
    case "ontbijt": return "bg-[hsl(42,35%,91%)] text-[hsl(42,30%,35%)] dark:bg-[hsl(42,25%,15%)] dark:text-[hsl(42,30%,72%)]";
    case "lunch": return "bg-[hsl(115,13%,92%)] text-[hsl(115,13%,38%)] dark:bg-[hsl(115,13%,15%)] dark:text-[hsl(115,13%,65%)]";
    case "diner": return "bg-[hsl(42,35%,89%)] text-[hsl(42,40%,34%)] dark:bg-[hsl(42,35%,15%)] dark:text-[hsl(42,40%,68%)]";
    case "snack": return "bg-[hsl(115,10%,90%)] text-[hsl(115,13%,40%)] dark:bg-[hsl(115,10%,15%)] dark:text-[hsl(115,13%,62%)]";
    case "tussendoortje": return "bg-[hsl(42,30%,91%)] text-[hsl(42,35%,40%)] dark:bg-[hsl(42,30%,15%)] dark:text-[hsl(42,30%,65%)]";
    default: return "bg-muted text-muted-foreground";
  }
}

/** Haal kid label + initial op uit KID_NAMES config */
export function getKidDisplayInfo(key: KidApproval): { initial: string; label: string } {
  if (key === "beiden") return { initial: "B", label: "Beiden" };
  const kid = KID_NAMES.find((k) => k.key === key);
  return {
    initial: kid ? kid.name.charAt(0) : key.charAt(0).toUpperCase(),
    label: kid ? kid.name : key,
  };
}
