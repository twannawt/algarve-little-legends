import { useState, useMemo } from "react";
import type { Recipe, RecipeCategory } from "@shared/schema";
import type { SortOption } from "@/lib/recipe-constants";

/**
 * Gedeelde filter/sort/search logica voor receptenlijsten.
 * Gebruikt door recipes.tsx en recipe-favorites.tsx.
 */
export function useRecipeFilters(recipes: Recipe[]) {
  const [filter, setFilter] = useState<"all" | "uncooked">("all");
  const [categoryFilters, setCategoryFilters] = useState<RecipeCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("nieuwste");

  function toggleCategoryFilter(cat: RecipeCategory) {
    setCategoryFilters((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  const filteredRecipes = useMemo(
    () =>
      recipes
        .filter((r) => {
          if (filter === "uncooked" && r.cooked) return false;
          const cats = r.categories || [];
          if (categoryFilters.length > 0 && !categoryFilters.some((f) => cats.includes(f)))
            return false;
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
        }),
    [recipes, filter, categoryFilters, searchQuery, sortBy]
  );

  const hasActiveFilters =
    filter !== "all" || categoryFilters.length > 0 || searchQuery !== "" || sortBy !== "nieuwste";

  function resetFilters() {
    setFilter("all");
    setCategoryFilters([]);
    setSearchQuery("");
    setSortBy("nieuwste");
  }

  return {
    filter,
    setFilter,
    categoryFilters,
    setCategoryFilters,
    toggleCategoryFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filteredRecipes,
    hasActiveFilters,
    resetFilters,
  };
}
