import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link as LinkIcon,
  ChefHat,
  Check,
  Loader2,
  CookingPot,
  X,
  FileText,
  Link2,
  Pencil,
  Users,
  User,
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  Search,
  ArrowUpDown,
  Heart,
  Clock,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToastAction } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Recipe, RecipeCategory, RecipeDifficulty, KidApproval, RecipeImportResult } from "@shared/schema";
import { FloatingResetButton } from "@/components/FloatingResetButton";

const categoryOptions: { key: RecipeCategory; labelKey: string }[] = [
  { key: "ontbijt", labelKey: "ontbijt" },
  { key: "lunch", labelKey: "lunchRecept" },
  { key: "diner", labelKey: "diner" },
  { key: "snack", labelKey: "snack" },
  { key: "tussendoortje", labelKey: "tussendoortje" },
  { key: "overig", labelKey: "overig" },
];

const filterOptions = [
  { key: "all", labelKey: "alleRecepten" },
  { key: "uncooked", labelKey: "nogNietGemaakt" },
] as const;

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

export default function RecipesPage() {
  const t = useT();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);
  const [importMode, setImportMode] = useState<"single" | "bulk">("single");
  const [url, setUrl] = useState("");
  const [bulkUrl, setBulkUrl] = useState("");
  const [importedData, setImportedData] = useState<RecipeImportResult | null>(null);
  const [title, setTitle] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<RecipeCategory[]>(["diner"]);
  const [isImporting, setIsImporting] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [filter, setFilter] = useState<"all" | "uncooked">("all");
  const [categoryFilters, setCategoryFilters] = useState<RecipeCategory[]>([]);
  const [surpriseCategory, setSurpriseCategory] = useState<RecipeCategory | null>(null);
  const [randomRecipe, setRandomRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("nieuwste");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [prepTime, setPrepTime] = useState<string>("");
  const [difficulty, setDifficulty] = useState<RecipeDifficulty | "">(""  );
  const suggestionRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Listen for bottom nav "add" button click
  const handleToggleAdd = useCallback(() => {
    setShowAddForm((v) => !v);
  }, []);

  useEffect(() => {
    window.addEventListener("toggle-add-recipe", handleToggleAdd);
    return () => window.removeEventListener("toggle-add-recipe", handleToggleAdd);
  }, [handleToggleAdd]);

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

  const { data: recipes = [], isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/recipes", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({ title: t("receptToegevoegd") });
      resetForm();
    },
  });

  const toggleCookedMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/recipes/${id}/cooked`);
      return res.json();
    },
    onSuccess: (data: Recipe, id: string) => {
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

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/recipes/${id}/favorite`);
      return res.json();
    },
    onSuccess: (data: Recipe, id: string) => {
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

  const toggleKidApprovalMutation = useMutation({
    mutationFn: async ({ id, tag }: { id: string; tag: KidApproval }) => {
      const res = await apiRequest("POST", `/api/recipes/${id}/kid-approval`, { tag });
      return res.json();
    },
    onSuccess: (_data: Recipe, variables: { id: string; tag: KidApproval }) => {
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

  const updateCategoriesMutation = useMutation({
    mutationFn: async ({ id, categories }: { id: string; categories: RecipeCategory[] }) => {
      const res = await apiRequest("PATCH", `/api/recipes/${id}/categories`, { categories });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recipes"] });
    },
  });

  function resetForm() {
    setShowAddForm(false);
    setUrl("");
    setBulkUrl("");
    setImportedData(null);
    setTitle("");
    setSelectedCategories(["diner"]);
    setImportMode("single");
    setPrepTime("");
    setDifficulty("");
  }

  function toggleCategory(cat: RecipeCategory) {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== cat);
      }
      return [...prev, cat];
    });
  }

  async function handleImportUrl() {
    if (!url.trim()) return;
    setIsImporting(true);
    try {
      const res = await apiRequest("POST", "/api/recipes/import-url", { url: url.trim() });
      const data: RecipeImportResult = await res.json();
      setImportedData(data);
      setTitle(data.title || "");
    } catch {
      toast({ title: t("receptUrlFout"), variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  }

  async function handleBulkImport() {
    if (!bulkUrl.trim()) return;
    setIsBulkImporting(true);
    try {
      const res = await apiRequest("POST", "/api/recipes/import-bulk", { url: bulkUrl.trim() });
      const data = await res.json();
      if (data.imported && data.imported > 0) {
        qc.invalidateQueries({ queryKey: ["/api/recipes"] });
        toast({ title: `${data.imported} recepten toegevoegd!` });
        resetForm();
      } else {
        toast({ title: "Geen recepten gevonden op deze pagina", variant: "destructive" });
      }
    } catch {
      toast({ title: t("receptUrlFout"), variant: "destructive" });
    } finally {
      setIsBulkImporting(false);
    }
  }

  function handleSubmit() {
    if (!title.trim() || !url.trim()) return;
    addMutation.mutate({
      title: title.trim(),
      url: url.trim(),
      imageUrl: importedData?.imageUrl || "",
      description: importedData?.description || "",
      siteName: importedData?.siteName || "",
      categories: selectedCategories,
      ...(prepTime ? { prepTime: parseInt(prepTime, 10) } : {}),
      ...(difficulty ? { difficulty } : {}),
    });
  }

  async function fetchRandomRecipe() {
    const url = surpriseCategory ? `/api/recipes/random?category=${surpriseCategory}` : "/api/recipes/random";
    try {
      const res = await apiRequest("GET", url);
      const recipe = await res.json();
      setRandomRecipe(recipe);
      setTimeout(() => {
        suggestionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } catch {
      toast({ title: "Geen recepten gevonden", variant: "destructive" });
    }
  }

  function toggleCategoryFilter(cat: RecipeCategory) {
    setCategoryFilters((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  const filteredRecipes = recipes
    .filter((r) => {
      if (filter === "uncooked" && r.cooked) return false;
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
        <div className="mb-4">
          <h1 className="text-2xl font-bold font-serif text-foreground tracking-tight">
            {t("receptenTitel")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("receptenSubtitel")}
          </p>
        </div>

        {/* Verras me — compact inline button with optional category dropdown */}
        <div className="flex items-center gap-2 mb-4">
          <button
            data-testid="recipe-random-button"
            onClick={fetchRandomRecipe}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(42,35%,62%)] text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
          >
            <Sparkles className="h-4 w-4" />
            {t("verrasMe")}
          </button>
          {surpriseCategory && (
            <span className="text-xs text-muted-foreground">
              {t((categoryOptions.find(c => c.key === surpriseCategory)?.labelKey || "overig") as any)}
            </span>
          )}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {categoryOptions.map(({ key, labelKey }) => (
              <button
                key={key}
                data-testid={`recipe-surprise-chip-${key}`}
                onClick={() => setSurpriseCategory(surpriseCategory === key ? null : key)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-all ${
                  surpriseCategory === key
                    ? "bg-[hsl(42,35%,62%)]/15 text-[hsl(42,30%,40%)] dark:text-[hsl(42,30%,72%)]"
                    : "text-muted-foreground/60 hover:text-muted-foreground"
                }`}
              >
                {t(labelKey as any)}
              </button>
            ))}
          </div>
        </div>

        {/* Random Recipe Suggestion — lightest terracotta */}
        {randomRecipe && (
          <Card ref={suggestionRef} className="mb-6 border-[hsl(42,30%,78%)] bg-[hsl(42,40%,95%)] dark:border-[hsl(42,30%,25%)] dark:bg-[hsl(42,25%,14%)] rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-[hsl(42,35%,62%)]" />
                    <span className="text-sm font-medium text-[hsl(42,30%,45%)] dark:text-[hsl(42,30%,68%)]">{t("suggestieTekst")}</span>
                  </div>
                  <h3 className="font-semibold text-foreground">{randomRecipe.title}</h3>
                  {randomRecipe.siteName && (
                    <p className="text-xs text-muted-foreground mt-0.5">{randomRecipe.siteName}</p>
                  )}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {(randomRecipe.categories || []).map((cat) => (
                      <span key={cat} className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getCategoryColor(cat)}`}>
                        {t(cat === "lunch" ? "lunchRecept" : cat as any)}
                      </span>
                    ))}
                  </div>
                  <a
                    href={randomRecipe.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-[hsl(42,30%,45%)] hover:text-[hsl(42,30%,35%)] dark:text-[hsl(42,30%,68%)] transition-colors"
                  >
                    {t("bekijkRecept")}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
                <button
                  data-testid="recipe-random-close"
                  onClick={() => setRandomRecipe(null)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Recipe Form — triggered by bottom nav */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="mb-6 rounded-2xl border-primary/20 shadow-sm overflow-hidden">
                <CardContent className="p-4 space-y-4">
                  {/* Close button */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{t("voegReceptToe")}</h3>
                    <button
                      data-testid="close-add-form"
                      onClick={() => setShowAddForm(false)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Import mode toggle */}
                  <div className="flex gap-2">
                    <button
                      data-testid="import-mode-single"
                      onClick={() => setImportMode("single")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        importMode === "single"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      {t("enkeleUrl")}
                    </button>
                    <button
                      data-testid="import-mode-bulk"
                      onClick={() => setImportMode("bulk")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        importMode === "bulk"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {t("bulkUrl")}
                    </button>
                  </div>

                  {importMode === "single" ? (
                    <>
                      {/* Single URL Input */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">{t("plakUrl")}</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                              data-testid="recipe-url-input"
                              type="url"
                              value={url}
                              onChange={(e) => setUrl(e.target.value)}
                              placeholder={t("urlPlaceholder")}
                              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              onKeyDown={(e) => e.key === "Enter" && handleImportUrl()}
                            />
                          </div>
                          <Button
                            data-testid="recipe-import-btn"
                            onClick={handleImportUrl}
                            disabled={!url.trim() || isImporting}
                            className="rounded-xl"
                          >
                            {isImporting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              t("receptOphalen")
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Imported Preview */}
                      {importedData && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex gap-3 p-3 rounded-xl bg-accent/5 border border-accent/20"
                        >
                          {importedData.imageUrl && (
                            <img
                              src={importedData.imageUrl}
                              alt=""
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">{importedData.siteName}</p>
                            <input
                              data-testid="recipe-title-input"
                              type="text"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              className="w-full font-semibold text-foreground bg-transparent border-none outline-none text-sm mt-0.5"
                              placeholder={t("titel")}
                            />
                            {importedData.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{importedData.description}</p>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Multi-Category Selector + Submit */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-2 block">
                          {t("categorieenLabel")}
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {categoryOptions.map((c) => {
                            const isSelected = selectedCategories.includes(c.key);
                            return (
                              <button
                                key={c.key}
                                data-testid={`add-category-${c.key}`}
                                onClick={() => toggleCategory(c.key)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                                  isSelected
                                    ? getCategoryColor(c.key) + " border-current/20"
                                    : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                                }`}
                              >
                                {t(c.labelKey as any)}
                                {isSelected && <Check className="inline h-3 w-3 ml-1" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Prep time & difficulty */}
                        <div className="flex gap-3 mb-3">
                          <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {t("bereidingstijd")}
                            </label>
                            <input
                              data-testid="prep-time-input"
                              type="number"
                              min="1"
                              max="480"
                              value={prepTime}
                              onChange={(e) => setPrepTime(e.target.value)}
                              placeholder="bijv. 30"
                              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              <Gauge className="inline h-3 w-3 mr-1" />
                              {t("moeilijkheidsgraad")}
                            </label>
                            <div className="flex gap-1.5">
                              {(["makkelijk", "gemiddeld", "moeilijk"] as RecipeDifficulty[]).map((d) => (
                                <button
                                  key={d}
                                  data-testid={`difficulty-${d}`}
                                  onClick={() => setDifficulty(difficulty === d ? "" : d)}
                                  className={`flex-1 px-2 py-2 rounded-xl text-xs font-medium border transition-all ${
                                    difficulty === d
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                                  }`}
                                >
                                  {t(d as any)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            data-testid="recipe-submit-btn"
                            onClick={handleSubmit}
                            disabled={!title.trim() || !url.trim() || addMutation.isPending}
                            className="rounded-xl gap-2"
                          >
                            {addMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            {t("receptToevoegen")}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Bulk URL mode */
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        {t("bulkUrlBeschrijving")}
                      </p>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          data-testid="recipe-bulk-url-input"
                          type="url"
                          value={bulkUrl}
                          onChange={(e) => setBulkUrl(e.target.value)}
                          placeholder={t("bulkUrlPlaceholder")}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          onKeyDown={(e) => e.key === "Enter" && handleBulkImport()}
                        />
                      </div>
                      <Button
                        data-testid="recipe-bulk-import-btn"
                        onClick={handleBulkImport}
                        disabled={!bulkUrl.trim() || isBulkImporting}
                        className="w-full rounded-xl gap-2"
                      >
                        {isBulkImporting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("receptOphalenBezig")}
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            {t("receptOphalen")}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category filters + Search + Sort row */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
          {categoryOptions.map(({ key, labelKey }) => {
            const count = recipes.filter((r) => (r.categories || []).includes(key)).length;
            return (
              <button
                key={key}
                data-testid={`recipe-cat-filter-${key}`}
                onClick={() => toggleCategoryFilter(key)}
                className={`h-7 px-2.5 text-[11px] rounded-full border whitespace-nowrap transition-all ${
                  categoryFilters.includes(key)
                    ? "border-accent bg-accent/10 text-accent font-medium"
                    : "border-border bg-card text-muted-foreground hover:border-accent/30"
                }`}
              >
                {t(labelKey as any)}
                <span className="ml-1 opacity-60">{count}</span>
              </button>
            );
          })}
          {categoryFilters.length > 0 && (
            <button
              data-testid="recipe-cat-filter-clear"
              onClick={() => setCategoryFilters([])}
              className="h-7 px-2.5 text-[11px] rounded-full border border-red-200 bg-red-50 text-red-500 whitespace-nowrap transition-all hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
            >
              Wissen
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              data-testid="recipe-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("zoekRecepten")}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {searchQuery && (
              <button
                data-testid="recipe-search-clear"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="relative" ref={sortRef}>
            <button
              data-testid="recipe-sort-button"
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 h-full px-3 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:border-primary/30 transition-all"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">{t("sorteerOp")}</span>
              {(filter !== "all" || sortBy !== "nieuwste") && (
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
                  className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px]"
                >
                  {/* Status filter section */}
                  <div className="px-3 pt-1.5 pb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Filter</div>
                  {filterOptions.map(({ key, labelKey }) => (
                    <button
                      key={key}
                      data-testid={`recipe-filter-${key}`}
                      onClick={() => { setFilter(key); setShowSortMenu(false); }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                        filter === key
                          ? "text-primary font-medium bg-primary/5"
                          : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {t(labelKey as any)}
                    </button>
                  ))}
                  {/* Divider */}
                  <div className="mx-2 my-1 border-t border-border/50" />
                  {/* Sort section */}
                  <div className="px-3 pt-1 pb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">{t("sorteerOp")}</div>
                  {sortOptions.map(({ key, labelKey }) => (
                    <button
                      key={key}
                      data-testid={`recipe-sort-${key}`}
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

        {/* Recipe count */}
        {!isLoading && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">
              {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recept' : 'recepten'}
              {(categoryFilters.length > 0 || filter !== 'all' || searchQuery) && ` (van ${recipes.length})`}
            </span>
          </div>
        )}

        {/* Skeleton loading */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border bg-card">
                <div className="h-40 bg-muted animate-pulse" />
                <div className="p-3.5 space-y-3">
                  <div className="flex gap-1.5">
                    <div className="h-5 w-12 bg-muted animate-pulse rounded-full" />
                    <div className="h-5 w-20 bg-muted animate-pulse rounded-full ml-auto" />
                  </div>
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="flex gap-1 pt-2 border-t border-border/50">
                    <div className="h-7 w-20 bg-muted animate-pulse rounded-lg" />
                    <div className="h-7 w-16 bg-muted animate-pulse rounded-lg" />
                    <div className="h-7 w-16 bg-muted animate-pulse rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) :
        /* Recipe List */
        filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <CookingPot className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">{t("geenRecepten")}</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
          >
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onToggleCooked={() => toggleCookedMutation.mutate(recipe.id)}
                onToggleFavorite={() => toggleFavoriteMutation.mutate(recipe.id)}
                onToggleKidApproval={(tag) => toggleKidApprovalMutation.mutate({ id: recipe.id, tag })}
                onUpdateCategories={(cats) => updateCategoriesMutation.mutate({ id: recipe.id, categories: cats })}
              />
            ))}
          </motion.div>
        )}
      </motion.section>

      <FloatingResetButton
        visible={filter !== "all" || categoryFilters.length > 0 || searchQuery !== "" || sortBy !== "nieuwste"}
        onReset={() => {
          setFilter("all");
          setCategoryFilters([]);
          setSearchQuery("");
          setSortBy("nieuwste");
        }}
      />
    </div>
  );
}

function RecipeCard({
  recipe,
  onToggleCooked,
  onToggleFavorite,
  onToggleKidApproval,
  onUpdateCategories,
}: {
  recipe: Recipe;
  onToggleCooked: () => void;
  onToggleFavorite: () => void;
  onToggleKidApproval: (tag: KidApproval) => void;
  onUpdateCategories: (categories: RecipeCategory[]) => void;
}) {
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

            {/* Kid approval — compact avatar circles */}
            {kidApprovalOptions.map(({ key }) => {
              const isActive = approvals.includes(key);
              const initial = key === "beiden" ? "B" : key === "charlie" ? "C" : "B";
              const label = key === "beiden" ? "Beiden" : key === "charlie" ? "Charlie" : "Bodi";
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
