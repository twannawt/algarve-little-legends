import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChefHat,
  Check,
  CookingPot,
  Users,
  User,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Recipe, RecipeCategory, KidApproval } from "@shared/schema";
import { FloatingResetButton } from "@/components/FloatingResetButton";

const categoryOptions: { key: RecipeCategory; labelKey: string }[] = [
  { key: "ontbijt", labelKey: "ontbijt" },
  { key: "lunch", labelKey: "lunchRecept" },
  { key: "diner", labelKey: "diner" },
  { key: "snack", labelKey: "snack" },
  { key: "tussendoortje", labelKey: "tussendoortje" },
  { key: "overig", labelKey: "overig" },
];

type FavFilter = "all" | "gemaakt" | "beiden" | "charlie" | "bodi";

const favFilterOptions: { key: FavFilter; labelKey: string }[] = [
  { key: "all", labelKey: "alleRecepten" },
  { key: "gemaakt", labelKey: "gemaakt" },
  { key: "beiden", labelKey: "beiden" },
  { key: "charlie", labelKey: "charlie" },
  { key: "bodi", labelKey: "bodi" },
];

const kidApprovalOptions: { key: KidApproval; labelKey: string }[] = [
  { key: "beiden", labelKey: "beiden" },
  { key: "charlie", labelKey: "charlie" },
  { key: "bodi", labelKey: "bodi" },
];

const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

function getCategoryColor(cat: RecipeCategory): string {
  switch (cat) {
    case "ontbijt": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "lunch": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "diner": return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
    case "snack": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    case "tussendoortje": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
}

export default function RecipeFavoritesPage() {
  const t = useT();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FavFilter>("all");

  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const toggleCookedMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/recipes/${id}/cooked`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recipes"] });
    },
  });

  const toggleKidApprovalMutation = useMutation({
    mutationFn: async ({ id, tag }: { id: string; tag: KidApproval }) => {
      const res = await apiRequest("POST", `/api/recipes/${id}/kid-approval`, { tag });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recipes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/recipes/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({ title: t("receptVerwijderd") });
    },
  });

  // Only show recipes that have at least one "favorite" marker (cooked or any kid approval)
  const favoriteRecipes = recipes.filter((r) => {
    const approvals = r.kidApproval || [];
    const isFavorite = r.cooked || approvals.length > 0;
    if (!isFavorite) return false;

    // Apply filter
    if (filter === "gemaakt") return r.cooked;
    if (filter === "beiden") return approvals.includes("beiden");
    if (filter === "charlie") return approvals.includes("charlie");
    if (filter === "bodi") return approvals.includes("bodi");
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <motion.section
        className="px-4 pt-6 pb-4"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-4">
          <h1 className="text-2xl font-bold font-serif text-foreground tracking-tight">
            {t("receptFavorieten")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Recepten die jullie gemaakt hebben of een hit zijn bij de kids
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
          {favFilterOptions.map(({ key, labelKey }) => (
            <button
              key={key}
              data-testid={`fav-filter-${key}`}
              onClick={() => setFilter(key)}
              className={`h-8 px-3 text-xs rounded-full border whitespace-nowrap transition-all ${
                filter === key
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              {t(labelKey as any)}
            </button>
          ))}
        </div>

        {/* Favorite Recipe List */}
        {favoriteRecipes.length === 0 ? (
          <div className="text-center py-12">
            <CookingPot className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">
              {filter === "all"
                ? "Nog geen favorieten. Markeer recepten als 'Gemaakt' of kies een kind op de receptenpagina."
                : "Geen recepten gevonden met dit filter."}
            </p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
          >
            {favoriteRecipes.map((recipe) => (
              <FavRecipeCard
                key={recipe.id}
                recipe={recipe}
                onToggleCooked={() => toggleCookedMutation.mutate(recipe.id)}
                onToggleKidApproval={(tag) => toggleKidApprovalMutation.mutate({ id: recipe.id, tag })}
                onDelete={() => deleteMutation.mutate(recipe.id)}
              />
            ))}
          </motion.div>
        )}
      </motion.section>

      <FloatingResetButton
        visible={filter !== "all"}
        onReset={() => setFilter("all")}
      />
    </div>
  );
}

function FavRecipeCard({
  recipe,
  onToggleCooked,
  onToggleKidApproval,
  onDelete,
}: {
  recipe: Recipe;
  onToggleCooked: () => void;
  onToggleKidApproval: (tag: KidApproval) => void;
  onDelete: () => void;
}) {
  const t = useT();
  const cats = recipe.categories || [];
  const approvals = recipe.kidApproval || [];

  return (
    <motion.div variants={fadeIn} transition={{ duration: 0.2 }}>
      <Card className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-border">
        {/* Image */}
        {recipe.imageUrl && (
          <a href={recipe.url} target="_blank" rel="noopener noreferrer">
            <div className="relative h-40 overflow-hidden">
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {recipe.cooked && (
                <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1.5 shadow-sm">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
              {approvals.length > 0 && (
                <div className="absolute top-2 right-2 flex gap-1">
                  {approvals.map((tag) => (
                    <span
                      key={tag}
                      className="bg-primary text-white rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm"
                    >
                      {tag === "beiden" ? "👫" : tag === "charlie" ? "👧" : "👦"}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </a>
        )}

        <CardContent className="p-3.5">
          {/* Category badges */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            {cats.map((cat) => (
              <span
                key={cat}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getCategoryColor(cat)}`}
              >
                {t((categoryOptions.find((c) => c.key === cat)?.labelKey || "overig") as any)}
              </span>
            ))}
            {recipe.siteName && (
              <span className="text-[11px] text-muted-foreground truncate ml-auto">{recipe.siteName}</span>
            )}
          </div>

          {/* Title */}
          <a
            href={recipe.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground text-sm hover:text-primary transition-colors line-clamp-2 block"
          >
            {recipe.title}
          </a>

          {/* Action buttons */}
          <div className="mt-3 pt-2.5 border-t border-border/50">
            <div className="flex items-center gap-1 flex-wrap">
              {/* Gemaakt button */}
              <button
                data-testid={`fav-cooked-${recipe.id}`}
                onClick={onToggleCooked}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  recipe.cooked
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <ChefHat className="h-3.5 w-3.5" />
                {t("gemaakt")}
              </button>

              {/* Kid approval buttons */}
              {kidApprovalOptions.map(({ key, labelKey }) => {
                const isActive = approvals.includes(key);
                const icon = key === "beiden" ? (
                  <Users className="h-3.5 w-3.5" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                );
                return (
                  <button
                    key={key}
                    data-testid={`fav-approval-${key}-${recipe.id}`}
                    onClick={() => onToggleKidApproval(key)}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {icon}
                    {t(labelKey as any)}
                  </button>
                );
              })}

              {/* Delete from favorites — removes recipe entirely */}
              <button
                data-testid={`fav-delete-${recipe.id}`}
                onClick={onDelete}
                className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title={t("verwijderen")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
