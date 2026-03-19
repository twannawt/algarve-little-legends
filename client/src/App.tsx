import { useEffect, lazy, Suspense } from "react";
import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient, setAuthTokenGetter } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { useOnlineStatus } from "@/hooks/use-online";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { AppTabs } from "@/components/AppTabs";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClerkProvider, SignIn, SignUp, useAuth } from "@clerk/clerk-react";

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
const RecipeDagplannerPage = lazy(() => import("@/pages/recipe-dagplanner"));
const NotFound = lazy(() => import("@/pages/not-found"));

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

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

// Wire Clerk token into apiRequest / queryFn
function AuthTokenSync() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}

function LoginPage() {
  const { t } = useI18n();
  const [location] = useLocation();
  const isSignUp = location === "/registreren";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold font-serif text-foreground">Little Legends</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isSignUp ? "Maak een account aan" : "Log in om verder te gaan"}
        </p>
      </div>
      {isSignUp ? (
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-md rounded-2xl border border-border",
            },
          }}
          signInUrl="/#/inloggen"
          forceRedirectUrl="/#/"
        />
      ) : (
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-md rounded-2xl border border-border",
            },
          }}
          signUpUrl="/#/registreren"
          forceRedirectUrl="/#/"
        />
      )}
    </div>
  );
}

function AppRouter() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <PageLoader />;

  // Show login page for auth routes or when not signed in
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Auth routes — always accessible */}
        <Route path="/inloggen" component={LoginPage} />
        <Route path="/registreren" component={LoginPage} />

        {/* Protected routes — redirect to login if not signed in */}
        {!isSignedIn ? (
          <Route>{() => <LoginPage />}</Route>
        ) : (
          <>
            <Route path="/" component={HomePage} />
            <Route path="/place/:id" component={PlaceDetail} />
            <Route path="/map" component={MapView} />
            <Route path="/favorites" component={FavoritesPage} />
            <Route path="/suggest" component={SuggestPage} />
            <Route path="/dagplanner" component={DagplannerPage} />
            <Route path="/recepten" component={RecipesPage} />
            <Route path="/recept-favorieten" component={RecipeFavoritesPage} />
            <Route path="/recept-dagplan" component={RecipeDagplannerPage} />
            <Route component={NotFound} />
          </>
        )}
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

function AppShell() {
  const { isSignedIn, isLoaded } = useAuth();

  // Don't show app chrome (header, nav, sidebar) when not signed in
  if (!isLoaded || !isSignedIn) {
    return (
      <main>
        <AppRouter />
      </main>
    );
  }

  return (
    <>
      <Header />
      <AppTabs />
      <OfflineBanner />
      <DesktopSidebar />
      <main className="min-h-screen md:ml-56">
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </main>
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_KEY} afterSignOutUrl="/#/inloggen">
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <TooltipProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <ScrollToTop />
              <AuthTokenSync />
              <AppShell />
            </Router>
          </TooltipProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
