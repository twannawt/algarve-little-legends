import { useEffect } from "react";
import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { useOnlineStatus } from "@/hooks/use-online";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import HomePage from "@/pages/home";
import PlaceDetail from "@/pages/place-detail";
import MapView from "@/pages/map";
import FavoritesPage from "@/pages/favorites";
import SuggestPage from "@/pages/suggest";
import DagplannerPage from "@/pages/dagplanner";
import NotFound from "@/pages/not-found";

function AnimatedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Component />
    </motion.div>
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
    <Switch>
        <Route path="/">
          <AnimatedRoute component={HomePage} />
        </Route>
        <Route path="/place/:id">
          <AnimatedRoute component={PlaceDetail} />
        </Route>
        <Route path="/map">
          <AnimatedRoute component={MapView} />
        </Route>
        <Route path="/favorites">
          <AnimatedRoute component={FavoritesPage} />
        </Route>
        <Route path="/suggest">
          <AnimatedRoute component={SuggestPage} />
        </Route>
        <Route path="/dagplanner">
          <AnimatedRoute component={DagplannerPage} />
        </Route>
        <Route>
          <AnimatedRoute component={NotFound} />
        </Route>
    </Switch>
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
