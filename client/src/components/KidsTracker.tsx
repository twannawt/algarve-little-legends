import { useState, useEffect } from "react";
import { KID_NAMES, getAge, type KidConfig } from "@shared/config";

/** Tailwind class map per hue — Tailwind can't handle dynamic hue values at purge time,
 *  so we map each kid's hue to pre-written utility classes. */
const hueStyles: Record<number, { card: string; avatar: string }> = {
  330: {
    card: "bg-[hsl(330,30%,96%)] dark:bg-[hsl(330,20%,14%)] border-[hsl(330,25%,88%)] dark:border-[hsl(330,15%,22%)]",
    avatar: "bg-[hsl(330,35%,90%)] dark:bg-[hsl(330,20%,22%)]",
  },
  200: {
    card: "bg-[hsl(200,30%,96%)] dark:bg-[hsl(200,20%,14%)] border-[hsl(200,25%,88%)] dark:border-[hsl(200,15%,22%)]",
    avatar: "bg-[hsl(200,35%,90%)] dark:bg-[hsl(200,20%,22%)]",
  },
};

function KidCard({ kid }: { kid: KidConfig }) {
  const age = getAge(kid.birthDate);
  const styles = hueStyles[kid.hue] ?? hueStyles[330];

  return (
    <div className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl border ${styles.card}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${styles.avatar}`}>
        {kid.emoji}
      </div>
      <div className="min-w-0">
        <span className="text-sm font-semibold text-foreground">{kid.name}</span>
        <p className="text-xs text-muted-foreground">
          {age.years} jaar{age.months > 0 ? `, ${age.months} ${age.months === 1 ? "maand" : "maanden"}` : ""}
        </p>
      </div>
    </div>
  );
}

export function KidsTracker() {
  const [, setTick] = useState(0);

  // Update once per day at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    const timeout = setTimeout(() => {
      setTick((t) => t + 1);
    }, msUntilMidnight);
    return () => clearTimeout(timeout);
  });

  return (
    <div className="flex gap-3 mb-4">
      {KID_NAMES.map((kid) => (
        <KidCard key={kid.key} kid={kid} />
      ))}
    </div>
  );
}
