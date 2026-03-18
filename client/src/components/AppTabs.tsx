import { useLocation } from "wouter";
import { UtensilsCrossed, MapPin } from "lucide-react";
import { useT } from "@/lib/i18n";

const tabs = [
  { path: "/", labelKey: "tabActiviteiten" as const, icon: MapPin },
  { path: "/recepten", labelKey: "tabRecepten" as const, icon: UtensilsCrossed },
];

// Show tabs on main section pages
const ACTIVITY_TAB_PATHS = new Set(["/", "/dagplanner", "/map", "/favorites", "/suggest"]);
const RECIPE_TAB_PATHS = new Set(["/recepten", "/recept-favorieten", "/recept-dagplan"]);

export function AppTabs() {
  const [location, navigate] = useLocation();
  const t = useT();

  const showTabs = ACTIVITY_TAB_PATHS.has(location) || RECIPE_TAB_PATHS.has(location);
  if (!showTabs) return null;

  // Determine which tab is active based on current section
  const inRecipes = RECIPE_TAB_PATHS.has(location);

  return (
    <div className="sticky top-16 z-40 backdrop-blur border-b bg-[--tabs-bg] border-[--tabs-border]">
      <div className="max-w-5xl mx-auto flex gap-2 px-3 py-2">
        {tabs.map((tab) => {
          // Active based on section, not exact path
          const isActive = tab.path === "/recepten" ? inRecipes : !inRecipes;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              data-testid={`tab-${tab.labelKey}`}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all ${
                isActive
                  ? "bg-primary/15 text-primary shadow-sm border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
              <span>{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
