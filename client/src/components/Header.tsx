import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

function AlgarveLittleLegendsLogo() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Little Legends logo"
      role="img"
    >
      {/* Soft sun glow */}
      <circle cx="24" cy="12" r="10" fill="hsl(var(--primary))" opacity="0.13" />
      <circle cx="24" cy="12" r="6.5" fill="hsl(var(--primary))" opacity="0.1" />
      {/* Sun rays — short, warm */}
      <g stroke="hsl(var(--primary))" strokeWidth="1.4" strokeLinecap="round" opacity="0.4">
        <line x1="24" y1="1" x2="24" y2="3.5" />
        <line x1="31.5" y1="5" x2="30" y2="7" />
        <line x1="16.5" y1="5" x2="18" y2="7" />
        <line x1="34.5" y1="12" x2="32" y2="12" />
        <line x1="13.5" y1="12" x2="16" y2="12" />
      </g>

      {/* Ground — gentle hill */}
      <ellipse cx="24" cy="44" rx="20" ry="6" fill="hsl(var(--accent))" opacity="0.1" />
      <path
        d="M6 40 Q24 32 42 40"
        stroke="hsl(var(--accent))"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.3"
        fill="none"
      />

      {/* Toddler (left, smaller — age 2) */}
      <g transform="translate(14.5, 18)">
        {/* Head */}
        <circle cx="4" cy="2.8" r="3.2" fill="hsl(var(--primary))" opacity="0.55" />
        {/* Rounded body shape — toddler silhouette */}
        <path
          d="M4 6 C2 6 0.5 9 0.5 12.5 C0.5 14.5 1.5 16 4 16 C6.5 16 7.5 14.5 7.5 12.5 C7.5 9 6 6 4 6Z"
          fill="hsl(var(--primary))"
          opacity="0.35"
        />
        {/* Arms up! */}
        <path d="M2 8 C0.5 6 -1 3.5 -1.5 2" stroke="hsl(var(--primary))" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
        <path d="M6 8 C7.5 6 9 3.5 9.5 2" stroke="hsl(var(--primary))" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
        {/* Little hands — dots */}
        <circle cx="-1.8" cy="1.5" r="0.9" fill="hsl(var(--primary))" opacity="0.45" />
        <circle cx="9.8" cy="1.5" r="0.9" fill="hsl(var(--primary))" opacity="0.45" />
        {/* Legs */}
        <path d="M2.5 15.5 L1.5 19.5" stroke="hsl(var(--primary))" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
        <path d="M5.5 15.5 L6.5 19.5" stroke="hsl(var(--primary))" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
      </g>

      {/* Older child (right, taller — age 5) */}
      <g transform="translate(27, 13)">
        {/* Head */}
        <circle cx="4" cy="2.5" r="3.4" fill="hsl(var(--accent))" opacity="0.5" />
        {/* Boho hair flower */}
        <circle cx="7" cy="1" r="1.6" fill="hsl(var(--primary))" opacity="0.4" />
        <circle cx="7" cy="1" r="0.7" fill="hsl(var(--accent))" opacity="0.5" />
        {/* Body — slender child shape */}
        <path
          d="M4 5.8 C2.2 6 1 9 1 13 C1 15.5 2 17.5 4 17.5 C6 17.5 7 15.5 7 13 C7 9 5.8 6 4 5.8Z"
          fill="hsl(var(--accent))"
          opacity="0.3"
        />
        {/* Arm waving */}
        <path d="M2 9 C0 7 -2 4.5 -2.5 3" stroke="hsl(var(--accent))" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
        {/* Arm holding flower stem */}
        <path d="M6 9.5 C8 8 10 6.5 11 5.5" stroke="hsl(var(--accent))" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
        {/* Flower at hand */}
        <circle cx="11.5" cy="4.8" r="1.8" fill="hsl(var(--primary))" opacity="0.35" />
        <circle cx="11.5" cy="4.8" r="0.7" fill="hsl(var(--accent))" opacity="0.55" />
        {/* Waving hand dot */}
        <circle cx="-2.8" cy="2.5" r="0.9" fill="hsl(var(--accent))" opacity="0.4" />
        {/* Legs */}
        <path d="M2.5 17 L1 23" stroke="hsl(var(--accent))" strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
        <path d="M5.5 17 L7 23" stroke="hsl(var(--accent))" strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
      </g>

      {/* Boho leaf detail left */}
      <path d="M8 33 C8 33 10 30 12 29" stroke="hsl(var(--accent))" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
      <path d="M9.5 31 C9 29.5 10.5 28.5 11.5 29.5 C12.5 30.5 10.5 32 9.5 31Z" fill="hsl(var(--accent))" opacity="0.2" />

      {/* Boho leaf detail right */}
      <path d="M40 33 C40 33 38 30 36 29" stroke="hsl(var(--accent))" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
      <path d="M38.5 31 C39 29.5 37.5 28.5 36.5 29.5 C35.5 30.5 37.5 32 38.5 31Z" fill="hsl(var(--accent))" opacity="0.2" />

      {/* Sparkles */}
      <g fill="hsl(var(--primary))" opacity="0.35">
        <circle cx="10" cy="10" r="0.7" />
        <circle cx="38" cy="9" r="0.6" />
        <circle cx="7" cy="22" r="0.5" />
        <circle cx="42" cy="20" r="0.5" />
      </g>
    </svg>
  );
}

export function Header() {
  const [, navigate] = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          data-testid="logo-home"
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <AlgarveLittleLegendsLogo />
          <span className="font-serif font-bold text-lg text-foreground leading-tight">Little Legends</span>
        </button>

        <Button
          data-testid="theme-toggle"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleTheme}
          aria-label={isDark ? "Schakel naar licht thema" : "Schakel naar donker thema"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
