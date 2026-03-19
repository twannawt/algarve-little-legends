import { Home, Map, Heart, CalendarDays, Plus, UtensilsCrossed, Star } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useT } from "@/lib/i18n";
import type { Place, Recipe } from "@shared/schema";

// Pages that belong to the "Wat gaan we eten" (recipes) section
const RECIPE_PATHS = new Set(["/recepten", "/recept-favorieten", "/recept-dagplan"]);

function isRecipesSection(location: string): boolean {
  return RECIPE_PATHS.has(location);
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function DesktopSidebar() {
  const [location, navigate] = useLocation();
  const t = useT();

  // Fetch counts for badges
  const { data: places = [] } = useQuery<Place[]>({ queryKey: ["/api/places"] });
  const { data: recipes = [] } = useQuery<Recipe[]>({ queryKey: ["/api/recipes"] });
  const favPlacesCount = places.filter(p => p.favorite).length;
  const favRecipesCount = recipes.filter(r => r.favorite).length;

  const inRecipes = isRecipesSection(location);

  const activityNav: NavItem[] = [
    { path: "/", label: t("home"), icon: Home },
    { path: "/dagplanner", label: t("dagplanner"), icon: CalendarDays },
    { path: "/map", label: t("kaart"), icon: Map },
    { path: "/favorites", label: t("favorieten"), icon: Heart },
  ];

  const recipeNav: NavItem[] = [
    { path: "/recepten", label: t("navRecepten"), icon: UtensilsCrossed },
    { path: "/recept-dagplan", label: t("receptDagplan"), icon: CalendarDays },
    { path: "/recept-favorieten", label: t("receptFavorieten"), icon: Star },
  ];

  const navItems = inRecipes ? recipeNav : activityNav;

  function handleAddClick() {
    if (inRecipes) {
      if (location !== "/recepten") {
        navigate("/recepten");
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("toggle-add-recipe"));
        }, 150);
      } else {
        window.dispatchEvent(new CustomEvent("toggle-add-recipe"));
      }
    } else {
      navigate("/suggest");
    }
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-16 bottom-0 z-40 w-56 flex-col border-r bg-[--nav-bg] border-[--nav-border]">
      <nav className="flex flex-col gap-1 p-3 pt-4 flex-1">
        {navItems.map((item) => {
          const isActive = location === item.path || (item.path === "/" && location.startsWith("/place/"));
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              data-testid={`sidebar-${item.label.toLowerCase()}`}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/12 text-primary border border-primary/25 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "fill-primary/20" : ""}`} />
              <span className="flex-1">{item.label}</span>
              {item.path === "/favorites" && favPlacesCount > 0 && (
                <span className="ml-auto text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {favPlacesCount}
                </span>
              )}
              {item.path === "/recept-favorieten" && favRecipesCount > 0 && (
                <span className="ml-auto text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {favRecipesCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Add button at the bottom of sidebar */}
      <div className="p-3 border-t border-[--nav-border]">
        <button
          data-testid="sidebar-toevoegen"
          onClick={handleAddClick}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/8 transition-colors"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/20">
            <Plus className="h-4 w-4" />
          </div>
          <span>{t("navToevoegen")}</span>
        </button>
      </div>
    </aside>
  );
}
