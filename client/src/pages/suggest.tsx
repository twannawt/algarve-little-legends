import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useT } from "@/lib/i18n";


const categoryOptions = [
  { value: "restaurant", labelKey: "restaurant" as const },
  { value: "beach", labelKey: "strand" as const },
  { value: "playground", labelKey: "speeltuin" as const },
  { value: "activity", labelKey: "activiteit" as const },
  { value: "attraction", labelKey: "attractie" as const },
] as const;

export default function SuggestPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const t = useT();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/suggestions", {
        name: name.trim(),
        location: location.trim(),
        category,
        description: description.trim(),
      });
      toast({ title: t("bedankt"), description: t("bedanktBeschrijving") });
      setName("");
      setLocation("");
      setCategory("restaurant");
      setDescription("");
    } catch {
      toast({ title: t("foutmelding"), description: t("probeerOpnieuw"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

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

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="suggest-name" className="block text-sm font-medium text-foreground mb-1.5">
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
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="suggest-location" className="block text-sm font-medium text-foreground mb-1.5">
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
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="suggest-category" className="block text-sm font-medium text-foreground mb-1.5">
                {t("categorieVeld")}
              </label>
              <select
                id="suggest-category"
                data-testid="suggest-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="suggest-description" className="block text-sm font-medium text-foreground mb-1.5">
                {t("beschrijvingVeld")}
              </label>
              <textarea
                id="suggest-description"
                data-testid="suggest-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("beschrijvingPlaceholder")}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            <Button
              data-testid="suggest-submit"
              type="submit"
              disabled={submitting || !name.trim() || !location.trim()}
              className="w-full h-12 bg-gradient-to-r from-[hsl(15,45%,55%)] to-[hsl(345,25%,60%)] text-white hover:opacity-90 shadow-sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? t("versturen") : t("verstuurSuggestie")}
            </Button>
          </form>
        </CardContent>
      </Card>


    </motion.div>
  );
}
