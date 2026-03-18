import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Link2, MapPin, Globe, Instagram, Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useT } from "@/lib/i18n";

const categoryOptions = [
  { value: "restaurant", labelKey: "restaurant" as const },
  { value: "beach", labelKey: "strand" as const },
  { value: "playground", labelKey: "speeltuin" as const },
  { value: "activity", labelKey: "activiteit" as const },
  { value: "attraction", labelKey: "attractie" as const },
] as const;

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

export default function SuggestPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const t = useT();

  // URL import state
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [website, setWebsite] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Toggle manual form visibility
  const [showManual, setShowManual] = useState(false);

  async function handleImport() {
    if (!googleMapsUrl && !websiteUrl && !instagramUrl) return;
    setImporting(true);
    try {
      const res = await apiRequest("POST", "/api/import-url", {
        googleMapsUrl,
        websiteUrl,
        instagramUrl,
      });
      const data = await res.json();

      // Auto-fill the form
      if (data.name) setName(data.name);
      if (data.location) setLocation(data.location);
      if (data.category) setCategory(data.category);
      if (data.description) setDescription(data.description);
      if (data.latitude) setLatitude(data.latitude);
      if (data.longitude) setLongitude(data.longitude);
      if (data.website) setWebsite(data.website);
      if (data.imageUrl) setImageUrl(data.imageUrl);

      setImported(true);
      setShowManual(true);
      toast({
        title: t("urlOpgehaald"),
        description: t("urlOpgehaaldBeschrijving"),
      });
    } catch {
      toast({
        title: t("urlFout"),
        description: t("urlFoutBeschrijving"),
        variant: "destructive",
      });
      setShowManual(true);
    } finally {
      setImporting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/places", {
        name: name.trim(),
        location: location.trim(),
        category,
        description: description.trim(),
        latitude,
        longitude,
        website: website.trim(),
        imageUrl: imageUrl.trim(),
      });
      // Invalidate places cache so the new place shows up immediately
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });

      toast({
        title: t("plekToegevoegd"),
        description: t("plekToegevoegdBeschrijving"),
      });
      // Reset everything
      setName("");
      setLocation("");
      setCategory("restaurant");
      setDescription("");
      setLatitude(0);
      setLongitude(0);
      setWebsite("");
      setImageUrl("");
      setGoogleMapsUrl("");
      setWebsiteUrl("");
      setInstagramUrl("");
      setImported(false);
      setShowManual(false);
    } catch {
      toast({
        title: t("foutmelding"),
        description: t("probeerOpnieuw"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const hasAnyUrl = googleMapsUrl.trim() || websiteUrl.trim() || instagramUrl.trim();

  return (
    <motion.div
      className="max-w-3xl mx-auto px-4 py-4 pb-24"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Button
        data-testid="back-button"
        variant="ghost"
        className="mb-4 -ml-2"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t("terug")}
      </Button>

      <h1 className="text-2xl font-bold font-serif text-foreground mb-1">
        {t("suggestiePagina")}
      </h1>
      <div className="w-8 h-0.5 bg-primary/40 rounded-full mb-2" />
      <p className="text-sm text-muted-foreground mb-6">
        {t("suggestieBeschrijving")}
      </p>

      {/* URL Import Section */}
      <Card className="rounded-2xl shadow-sm mb-4 border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {t("urlImportTitel")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("urlImportBeschrijving")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Google Maps URL */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                data-testid="import-google-maps"
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder={t("googleMapsUrl")}
                className={`${inputClass} pl-10`}
              />
            </div>

            {/* Website URL */}
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                data-testid="import-website"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder={t("websiteUrl")}
                className={`${inputClass} pl-10`}
              />
            </div>

            {/* Instagram URL */}
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                data-testid="import-instagram"
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder={t("instagramUrl")}
                className={`${inputClass} pl-10`}
              />
            </div>

            <Button
              data-testid="import-button"
              type="button"
              onClick={handleImport}
              disabled={importing || !hasAnyUrl}
              className="w-full h-11 bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("bezigMetOphalen")}
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  {t("ophalen")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Divider / toggle for manual form */}
      <button
        type="button"
        onClick={() => setShowManual((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        data-testid="toggle-manual"
      >
        <div className="flex-1 h-px bg-border" />
        <span className="flex items-center gap-1 px-2">
          {showManual ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {t("ofVulHandmatigIn")}
        </span>
        <div className="flex-1 h-px bg-border" />
      </button>

      {/* Manual Form — always visible after import, toggleable otherwise */}
      <AnimatePresence>
        {(showManual || imported) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="rounded-2xl shadow-sm mt-2">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="suggest-name"
                      className="block text-sm font-medium text-foreground mb-1.5"
                    >
                      {t("naamVeld")}
                    </label>
                    <input
                      id="suggest-name"
                      data-testid="suggest-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("naamPlaceholder")}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="suggest-location"
                      className="block text-sm font-medium text-foreground mb-1.5"
                    >
                      {t("locatieVeld")}
                    </label>
                    <input
                      id="suggest-location"
                      data-testid="suggest-location"
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t("locatiePlaceholder")}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="suggest-category"
                      className="block text-sm font-medium text-foreground mb-1.5"
                    >
                      {t("categorieVeld")}
                    </label>
                    <select
                      id="suggest-category"
                      data-testid="suggest-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={inputClass}
                    >
                      {categoryOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {t(opt.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="suggest-description"
                      className="block text-sm font-medium text-foreground mb-1.5"
                    >
                      {t("beschrijvingVeld")}
                    </label>
                    <textarea
                      id="suggest-description"
                      data-testid="suggest-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t("beschrijvingPlaceholder")}
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <Button
                    data-testid="suggest-submit"
                    type="submit"
                    disabled={submitting || !name.trim() || !location.trim()}
                    className="w-full h-12 bg-gradient-to-r from-[hsl(15,45%,55%)] to-[hsl(345,25%,60%)] text-white hover:opacity-90 shadow-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("versturen")}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t("verstuurSuggestie")}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
