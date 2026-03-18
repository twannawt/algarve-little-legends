import { Home, Map, Heart, CalendarDays, Plus, UtensilsCrossed, Star } from "lucide-react";
import { useLocation } from "wouter";
import { useT } from "@/lib/i18n";

// Pages that belong to the "Wat gaan we eten" (recipes) section
const RECIPE_PATHS = new Set(["/recepten", "/recept-favorieten"]);

// Pages that belong to the "Wat gaan we doen" (activities) section
const ACTIVITY_PATHS = new Set(["/", "/dagplanner", "/map", "/favorites", "/suggest", "/place"]);

function isActivitiesSection(location: string): boolean {
  if (ACTIVITY_PATHS.has(location)) return true;
  if (location.startsWith("/place/")) return true;
  return false;
}

function isRecipesSection(location: string): boolean {
  return RECIPE_PATHS.has(location);
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: () => void;
}

export function BottomNav() {
  const [location, navigate] = useLocation();
  const t = useT();

  const inRecipes = isRecipesSection(location);

  // Build navigation items based on current section
  const activityNav: NavItem[] = [
    { path: "/", label: t("home"), icon: Home },
    { path: "/dagplanner", label: t("dagplanner"), icon: CalendarDays },
    { path: "/map", label: t("kaart"), icon: Map },
    { path: "/favorites", label: t("favorieten"), icon: Heart },
  ];

  const recipeNav: NavItem[] = [
    { path: "/recepten", label: t("navRecepten"), icon: UtensilsCrossed },
    { path: "/recept-favorieten", label: t("receptFavorieten"), icon: Star },
  ];

  const navItems = inRecipes ? recipeNav : activityNav;
  const addPath = inRecipes ? "__add-recipe__" : "/suggest";
  const addLabel = t("navToevoegen");

  // Dispatch a custom event for the recipes page to listen to
  function handleAddClick() {
    if (inRecipes) {
      window.dispatchEvent(new CustomEvent("toggle-add-recipe"));
    } else {
      navigate("/suggest");
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur" style={{ boxShadow: "0 -2px 10px rgba(60,50,40,0.06)" }}>
      {/* Boho wavy separator */}
      <svg className="w-full h-2 text-border" viewBox="0 0 1200 8" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 4 Q150 0 300 4 Q450 8 600 4 Q750 0 900 4 Q1050 8 1200 4" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
      <div className="max-w-5xl mx-auto flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              data-testid={`nav-${item.label.toLowerCase()}`}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "fill-primary/20" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-primary -mt-0.5" />
              )}
            </button>
          );
        })}

        {/* Add button — always present */}
        <button
          data-testid="nav-toevoegen"
          onClick={handleAddClick}
          className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg text-primary hover:text-primary/80 transition-colors"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border border-primary/20">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium">{addLabel}</span>
        </button>
      </div>
    </nav>
  );
}
