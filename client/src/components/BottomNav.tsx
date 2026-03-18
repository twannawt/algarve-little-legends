import { Home, Map, Heart, CalendarDays } from "lucide-react";
import { useLocation } from "wouter";
import { useT } from "@/lib/i18n";

export function BottomNav() {
  const [location, navigate] = useLocation();
  const t = useT();

  const navItems = [
    { path: "/", label: t("home"), icon: Home },
    { path: "/dagplanner", label: t("dagplanner"), icon: CalendarDays },
    { path: "/map", label: t("kaart"), icon: Map },
    { path: "/favorites", label: t("favorieten"), icon: Heart },
  ];

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
      </div>
    </nav>
  );
}
