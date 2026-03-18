import { useLocation } from "wouter";
import { UtensilsCrossed, MapPin } from "lucide-react";
import { useT } from "@/lib/i18n";

const tabs = [
  { path: "/", labelKey: "tabActiviteiten" as const, icon: MapPin },
  { path: "/recepten", labelKey: "tabRecepten" as const, icon: UtensilsCrossed },
];

// Only show on home and recipes pages
const TAB_PATHS = new Set(["/", "/recepten"]);

export function AppTabs() {
  const [location, navigate] = useLocation();
  const t = useT();

  if (!TAB_PATHS.has(location)) return null;

  return (
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-5xl mx-auto flex gap-2 px-3 py-2">
        {tabs.map((tab) => {
          const isActive = location === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              data-testid={`tab-${tab.labelKey}`}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all ${
                isActive
                  ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
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
