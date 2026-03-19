import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  ChefHat,
  Check,
  CookingPot,
  Users,
  User,
  Trash2,
  ArrowLeft,
  UtensilsCrossed,
  Search,
  ArrowUpDown,
  X,
  Heart,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ToastAction } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Recipe, RecipeCategory, KidApproval } from "@shared/schema";
import { AnimatePresence } from "framer-motion";
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

type SortOption = "nieuwste" | "oudste" | "az" | "za";

const sortOptions: { key: SortOption; labelKey: string }[] = [
  { key: "nieuwste", labelKey: "nieuwsteEerst" },
  { key: "oudste", labelKey: "oudsteEerst" },
  { key: "az", labelKey: "alfabetisch" },
  { key: "za", labelKey: "alfabetischOmgekeerd" },
];

const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

// Bali Green + Warm Terracotta palette for category badges
function getCategoryColor(cat: RecipeCategory): string {
  switch (cat) {
    case "ontbijt": return "bg-[hsl(42,35%,91%)] text-[hsl(42,30%,35%)] dark:bg-[hsl(42,25%,15%)] dark:text-[hsl(42,30%,72%)]";
    case "lunch": return "bg-[hsl(115,13%,92%)] text-[hsl(115,13%,38%)] dark:bg-[hsl(115,13%,15%)] dark:text-[hsl(115,13%,65%)]";
    case "diner": return "bg-[hsl(42,35%,89%)] text-[hsl(42,40%,34%)] dark:bg-[hsl(42,35%,15%)] dark:text-[hsl(42,40%,68%)]";
    case "snack": return "bg-[hsl(115,10%,90%)] text-[hsl(115,13%,40%)] dark:bg-[hsl(115,10%,15%)] dark:text-[hsl(115,13%,62%)]";
    case "tussendoortje": return "bg-[hsl(42,30%,91%)] text-[hsl(42,35%,40%)] dark:bg-[hsl(42,30%,15%)] dark:text-[hsl(42,30%,65%)]";
    default: return "bg-muted text-muted-foreground";
  }
}

export default function RecipeFavoritesPage() {
  const t = useT();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FavFilter>("all");
  const [categoryFilters, setCategoryFilters] = useState<RecipeCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("nieuwste");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on click outside
  useEffect(() => {
    if (!showSortMenu) return;
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSortMenu]);

  function toggleCategoryFilter(cat: RecipeCategory) {
    setCategoryFilters((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const toggleCookedMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/recipes/${id}/cooked`);
      return res.json();
    },
    onSuccess: (data: any, id: string) => {
      qc.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: data.cooked ? t("gemaaktAan") : t("gemaaktUit"),
        action: (
          <ToastAction altText={t("ongedaanMaken")} onClick={() => toggleCookedMutation.mutate(id)}>
            {t("ongedaanMaken")}
          </ToastAction>
        ),
      });
    },
  });

  const toggleKidApprovalMutation = useMutation({
    mutationFn: async ({ id, tag }: { id: string; tag: KidApproval }) => {
      const res = await apiRequest("POST", `/api/recipes/${id}/kid-approval`, { tag });
      return res.json();
    },
    onSuccess: (_data: any, variables: { id: string; tag: KidApproval }) => {
      qc.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: `${variables.tag} bijgewerkt`,
        action: (
          <ToastAction altText={t("ongedaanMaken")} onClick={() => toggleKidApprovalMutation.mutate(variables)}>
            {t("ongedaanMaken")}
          </ToastAction>
        ),
      });
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

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/recipes/${id}/favorite`);
      return res.json();
    },
    onSuccess: (data: any, id: string) => {
      qc.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: data.favorite ? t("favorietAan") : t("favorietUit"),
        action: (
          <ToastAction altText={t("ongedaanMaken")} onClick={() => toggleFavoriteMutation.mutate(id)}>
            {t("ongedaanMaken")}
          </ToastAction>
        ),
      });
    },
  });

  // Only show recipes marked as favorite
  const favoriteRecipes = recipes
    .filter((r) => {
      if (!r.favorite) return false;
      const approvals = r.kidApproval || [];

      // Apply fav filter
      if (filter === "gemaakt" && !r.cooked) return false;
      if (filter === "beiden" && !approvals.includes("beiden")) return false;
      if (filter === "charlie" && !approvals.includes("charlie")) return false;
      if (filter === "bodi" && !approvals.includes("bodi")) return false;

      // Apply category filter
      const cats = r.categories || [];
      if (categoryFilters.length > 0 && !categoryFilters.some((f) => cats.includes(f))) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchDesc = (r.description || "").toLowerCase().includes(q);
        const matchSite = (r.siteName || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSite) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oudste":
          return (a.createdAt || "").localeCompare(b.createdAt || "");
        case "az":
          return a.title.localeCompare(b.title, "nl");
        case "za":
          return b.title.localeCompare(a.title, "nl");
        case "nieuwste":
        default:
          return (b.createdAt || "").localeCompare(a.createdAt || "");
      }
    });

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-8">
      <motion.section
        className="px-4 pt-6 pb-4"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.25 }}
      >
        {/* Back to recipes link (visible on desktop where bottom nav is far away) */}
        <button
          onClick={() => navigate("/recepten")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <UtensilsCrossed className="h-3.5 w-3.5" />
          {t("navRecepten")}
        </button>

        <div className="mb-4">
          <h1 className="text-2xl font-bold font-serif text-foreground tracking-tight">
            {t("receptFavorieten")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Recepten die je hebt bewaard als favoriet
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
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

        {/* Category filters (multi-select) */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide">
          {categoryOptions.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => toggleCategoryFilter(key)}
              className={`h-7 px-2.5 text-[11px] rounded-full border whitespace-nowrap transition-all ${
                categoryFilters.includes(key)
                  ? "border-accent bg-accent/10 text-accent font-medium"
                  : "border-border bg-card text-muted-foreground hover:border-accent/30"
              }`}
            >
              {t(labelKey as any)}
            </button>
          ))}
          {categoryFilters.length > 0 && (
            <button
              onClick={() => setCategoryFilters([])}
              className="h-7 px-2.5 text-[11px] rounded-full border border-red-200 bg-red-50 text-red-500 whitespace-nowrap transition-all hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
            >
              Wissen
            </button>
          )}
        </div>

        {/* Search + Sort row */}
        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              data-testid="fav-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("zoekRecepten")}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {searchQuery && (
              <button
                data-testid="fav-search-clear"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="relative" ref={sortRef}>
            <button
              data-testid="fav-sort-button"
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 h-full px-3 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:border-primary/30 transition-all"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">{t("sorteerOp")}</span>
              {sortBy !== "nieuwste" && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[140px]"
                >
                  {sortOptions.map(({ key, labelKey }) => (
                    <button
                      key={key}
                      data-testid={`fav-sort-${key}`}
                      onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                        sortBy === key
                          ? "text-primary font-medium bg-primary/5"
                          : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {t(labelKey as any)}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Favorite Recipe List */}
        {favoriteRecipes.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">
              {filter === "all"
                ? "Nog geen favorieten. Tik op het hartje bij een recept om het hier te bewaren."
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
        visible={filter !== "all" || categoryFilters.length > 0 || searchQuery !== "" || sortBy !== "nieuwste"}
        onReset={() => { setFilter("all"); setCategoryFilters([]); setSearchQuery(""); setSortBy("nieuwste"); }}
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
      <Card className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border ${approvals.length > 0 ? "border-[hsl(42,30%,65%)]/40 dark:border-[hsl(42,30%,55%)]/50" : "border-border"}`}>
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
                <div className="absolute top-2 left-2 bg-[hsl(42,35%,55%)] text-white rounded-full p-1.5 shadow-sm">
                  <ChefHat className="h-3.5 w-3.5" />
                </div>
              )}
              {approvals.length > 0 && (
                <div className="absolute top-2 right-2 flex gap-1">
                  {approvals.map((tag) => (
                    <span
                      key={tag}
                      className="bg-[hsl(42,35%,55%)] text-white rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm flex items-center gap-0.5"
                    >
                      {tag === "beiden" ? <Users className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      <span className="capitalize">{tag}</span>
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

          {/* Compact action row */}
          <div className="mt-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              {/* Gemaakt toggle — compact icon */}
              <button
                data-testid={`fav-cooked-${recipe.id}`}
                onClick={onToggleCooked}
                title={t("gemaakt")}
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-all ${
                  recipe.cooked
                    ? "bg-[hsl(42,30%,90%)] text-[hsl(42,30%,35%)] dark:bg-[hsl(42,20%,18%)] dark:text-[hsl(42,30%,70%)]"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <ChefHat className="h-3.5 w-3.5" />
              </button>

              <div className="w-px h-4 bg-border/50" />

              {/* Kid approval — compact avatar circles */}
              {kidApprovalOptions.map(({ key }) => {
                const isActive = approvals.includes(key);
                const initial = key === "beiden" ? "B" : key === "charlie" ? "C" : "B";
                const label = key === "beiden" ? "Beiden" : key === "charlie" ? "Charlie" : "Bodi";
                return (
                  <button
                    key={key}
                    data-testid={`fav-approval-${key}-${recipe.id}`}
                    onClick={() => onToggleKidApproval(key)}
                    title={label}
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold transition-all ${
                      isActive
                        ? "bg-primary/15 text-primary ring-1 ring-primary/30 dark:bg-primary/20"
                        : "bg-muted text-muted-foreground/60 hover:bg-muted/80"
                    }`}
                  >
                    {key === "beiden" ? <Users className="h-3.5 w-3.5" /> : initial}
                  </button>
                );
              })}

              {/* Delete from favorites */}
              <button
                data-testid={`fav-delete-${recipe.id}`}
                onClick={onDelete}
                className="ml-auto p-1.5 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
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
