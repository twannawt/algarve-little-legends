import { useEffect, lazy, Suspense } from "react";
import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { useOnlineStatus } from "@/hooks/use-online";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { AppTabs } from "@/components/AppTabs";

// Eager-load home (initial route)
import HomePage from "@/pages/home";

// Lazy-load all other pages — loaded on demand
const PlaceDetail = lazy(() => import("@/pages/place-detail"));
const MapView = lazy(() => import("@/pages/map"));
const FavoritesPage = lazy(() => import("@/pages/favorites"));
const SuggestPage = lazy(() => import("@/pages/suggest"));
const DagplannerPage = lazy(() => import("@/pages/dagplanner"));
const RecipesPage = lazy(() => import("@/pages/recipes"));
const RecipeFavoritesPage = lazy(() => import("@/pages/recipe-favorites"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/place/:id" component={PlaceDetail} />
        <Route path="/map" component={MapView} />
        <Route path="/favorites" component={FavoritesPage} />
        <Route path="/suggest" component={SuggestPage} />
        <Route path="/dagplanner" component={DagplannerPage} />
        <Route path="/recepten" component={RecipesPage} />
        <Route path="/recept-favorieten" component={RecipeFavoritesPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { t } = useI18n();
  if (isOnline) return null;
  return (
    <div className="bg-amber-500/90 text-white text-center text-sm py-2 px-4">
      {t("offline")}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <ScrollToTop />
            <Header />
            <AppTabs />
            <OfflineBanner />
            <main className="min-h-screen">
              <AppRouter />
            </main>
            <BottomNav />
          </Router>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
