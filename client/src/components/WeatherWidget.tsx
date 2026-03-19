import { useState } from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import type { WeatherData } from "@shared/schema";

export function getWeatherIcon(code: number, size = "h-5 w-5"): React.ReactNode {
  if (code <= 1) return <Sun className={`${size} text-amber-500`} />;
  if (code <= 3) return <Cloud className={`${size} text-gray-400`} />;
  if (code <= 48) return <CloudFog className={`${size} text-gray-400`} />;
  if (code <= 57) return <CloudDrizzle className={`${size} text-blue-400`} />;
  if (code <= 67) return <CloudRain className={`${size} text-blue-500`} />;
  if (code <= 77) return <CloudSnow className={`${size} text-blue-200`} />;
  if (code <= 82) return <CloudRain className={`${size} text-blue-600`} />;
  if (code <= 99) return <CloudLightning className={`${size} text-yellow-500`} />;
  return <Cloud className={size} />;
}

export function useWeatherLabel() {
  const t = useT();
  return (code: number): string => {
    if (code <= 1) return t("zonnig");
    if (code <= 3) return t("bewolkt");
    if (code <= 48) return t("mistig");
    if (code <= 57) return t("motregen");
    if (code <= 67) return t("regen");
    if (code <= 77) return t("sneeuw");
    if (code <= 82) return t("buien");
    if (code <= 99) return t("onweer");
    return "";
  };
}

export function useWeatherSuggestion() {
  const t = useT();
  return (weather: WeatherData): string => {
    const { temperature, weathercode } = weather.current;
    if (weathercode < 3 && temperature > 25) return t("perfectStrandweer");
    if (weathercode < 3 && temperature > 15) return t("heerlijkWeer");
    if (weathercode >= 51) return t("binnenactiviteit");
    if (temperature < 15) return t("fris");
    return t("lekkerWeer");
  };
}

interface WeatherWidgetProps {
  weather: WeatherData;
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const getWeatherSuggestion = useWeatherSuggestion();

  return (
    <>
      <button
        data-testid="weather-widget"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors shrink-0"
      >
        {getWeatherIcon(weather.current.weathercode, "h-5 w-5")}
        <span className="text-lg font-bold text-foreground">{Math.round(weather.current.temperature)}°</span>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 flex items-center gap-4 py-2 px-3 rounded-xl bg-card border border-border col-span-full"
        >
          <p className="text-xs text-primary font-medium whitespace-nowrap">{getWeatherSuggestion(weather)}</p>
          <div className="flex gap-3 ml-auto">
            {weather.daily.map((day) => {
              const dayName = new Date(day.date).toLocaleDateString("nl-NL", { weekday: "short" });
              return (
                <div key={day.date} className="flex flex-col items-center gap-0.5 text-xs">
                  <span className="text-muted-foreground capitalize">{dayName}</span>
                  <span className="scale-75">{getWeatherIcon(day.weathercode)}</span>
                  <span className="text-foreground font-medium">{Math.round(day.tempMax)}°</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </>
  );
}
