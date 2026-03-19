import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  Check,
  Pencil,
  Users,
  User,
  UtensilsCrossed,
  Heart,
  Clock,
  Gauge,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import type { Recipe, RecipeCategory, KidApproval } from "@shared/schema";
import {
  categoryOptions,
  kidApprovalOptions,
  getCategoryColor,
  getKidDisplayInfo,
  fadeIn,
} from "@/lib/recipe-constants";

interface RecipeCardProps {
  recipe: Recipe;
  onToggleCooked: () => void;
  onToggleFavorite: () => void;
  onToggleKidApproval: (tag: KidApproval) => void;
  onUpdateCategories: (categories: RecipeCategory[]) => void;
}

export function RecipeCard({
  recipe,
  onToggleCooked,
  onToggleFavorite,
  onToggleKidApproval,
  onUpdateCategories,
}: RecipeCardProps) {
  const t = useT();
  const [editingCategories, setEditingCategories] = useState(false);
  const cats = recipe.categories || [];
  const approvals = recipe.kidApproval || [];

  function toggleCat(cat: RecipeCategory) {
    const current = [...cats];
    if (current.includes(cat)) {
      if (current.length === 1) return; // keep at least 1
      onUpdateCategories(current.filter((c) => c !== cat));
    } else {
      onUpdateCategories([...current, cat]);
    }
  }

  const hasAnyApproval = approvals.length > 0;

  return (
    <motion.div variants={fadeIn} transition={{ duration: 0.2 }} className="h-full">
      <Card className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border h-full flex flex-col ${hasAnyApproval ? "border-[hsl(42,30%,65%)]/40 dark:border-[hsl(42,30%,55%)]/50" : "border-border"}`}>
        {/* Image */}
        <a href={recipe.url} target="_blank" rel="noopener noreferrer">
          <div className="relative h-40 overflow-hidden">
            {recipe.imageUrl ? (
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[hsl(42,30%,92%)] to-[hsl(140,15%,90%)] dark:from-[hsl(42,20%,16%)] dark:to-[hsl(140,15%,14%)] flex items-center justify-center">
                <UtensilsCrossed className="h-10 w-10 text-muted-foreground/20" />
              </div>
            )}
            {recipe.cooked && (
              <div className="absolute top-2 left-2 bg-[hsl(42,35%,55%)] text-white rounded-full p-1.5 shadow-sm">
                <ChefHat className="h-3.5 w-3.5" />
              </div>
            )}
            {hasAnyApproval && (
              <div className="absolute top-2 right-2 flex gap-1">
                {approvals.map((tag) => {
                  const { label } = getKidDisplayInfo(tag);
                  return (
                    <span
                      key={tag}
                      className="bg-[hsl(42,35%,55%)] text-white rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm flex items-center gap-0.5"
                    >
                      {tag === "beiden" ? <Users className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      <span className="capitalize">{label}</span>
                    </span>
                  );
                })}
              </div>
            )}
            {/* Favorite heart overlay */}
            <button
              data-testid={`recipe-fav-${recipe.id}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }}
              className={`absolute bottom-2 right-2 p-1.5 rounded-full shadow-sm transition-all ${
                recipe.favorite
                  ? "bg-red-500 text-white"
                  : "bg-white/80 dark:bg-black/50 text-muted-foreground hover:text-red-500"
              }`}
            >
              <Heart className={`h-4 w-4 ${recipe.favorite ? "fill-current" : ""}`} />
            </button>
          </div>
        </a>

        <CardContent className="p-3.5 flex flex-col flex-1">
          {/* Category badges — clickable to edit */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            {cats.map((cat) => (
              <span
                key={cat}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getCategoryColor(cat)}`}
              >
                {t((categoryOptions.find((c) => c.key === cat)?.labelKey || "overig") as any)}
              </span>
            ))}
            <button
              data-testid={`recipe-edit-cats-${recipe.id}`}
              onClick={() => setEditingCategories(!editingCategories)}
              className="p-2.5 -m-1 rounded min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              title="Categorieën bewerken"
            >
              <Pencil className="h-3 w-3" />
            </button>
            {recipe.siteName && (
              <span className="text-[11px] text-muted-foreground truncate ml-auto">{recipe.siteName}</span>
            )}
          </div>

          {/* Inline category editor */}
          <AnimatePresence>
            {editingCategories && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="mb-2"
              >
                <div className="flex flex-wrap gap-1 py-1.5">
                  {categoryOptions.map((c) => {
                    const isSelected = cats.includes(c.key);
                    return (
                      <button
                        key={c.key}
                        data-testid={`edit-cat-${recipe.id}-${c.key}`}
                        onClick={() => toggleCat(c.key)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border ${
                          isSelected
                            ? getCategoryColor(c.key) + " border-current/20"
                            : "bg-muted/30 text-muted-foreground/60 border-border/50 hover:border-primary/30"
                        }`}
                      >
                        {t(c.labelKey as any)}
                        {isSelected && <Check className="inline h-2.5 w-2.5 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title */}
          <a
            href={recipe.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground text-sm hover:text-primary transition-colors line-clamp-2 block"
          >
            {recipe.title}
          </a>

          {/* Prep time & difficulty */}
          {(recipe.prepTime || recipe.difficulty) && (
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
              {recipe.prepTime && (
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {recipe.prepTime} {t("minuten")}
                </span>
              )}
              {recipe.difficulty && (
                <span className={`flex items-center gap-0.5 ${
                  recipe.difficulty === "makkelijk" ? "text-green-600 dark:text-green-400" :
                  recipe.difficulty === "gemiddeld" ? "text-amber-600 dark:text-amber-400" :
                  "text-red-600 dark:text-red-400"
                }`}>
                  <Gauge className="h-3 w-3" />
                  {t(recipe.difficulty as any)}
                </span>
              )}
            </div>
          )}

          {/* Compact action row */}
          <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-border/50">
            {/* Gemaakt toggle — compact icon */}
            <button
              data-testid={`recipe-cooked-${recipe.id}`}
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

            {/* Kid approval — compact avatar circles from config */}
            {kidApprovalOptions.map(({ key }) => {
              const isActive = approvals.includes(key);
              const { initial, label } = getKidDisplayInfo(key);
              return (
                <button
                  key={key}
                  data-testid={`recipe-approval-${key}-${recipe.id}`}
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
