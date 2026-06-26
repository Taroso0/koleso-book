"use client";

import { useMotionPreference } from "./MotionProvider";

/** Ручной тумблер «снизить эффекты» (сверх ОС-настройки). */
export function ReduceMotionToggle() {
  const { reduceEffects, setReduceEffects } = useMotionPreference();
  return (
    <button
      type="button"
      aria-pressed={reduceEffects}
      onClick={() => setReduceEffects(!reduceEffects)}
      className="rounded-md border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {reduceEffects ? "движение: снижено" : "снизить движение"}
    </button>
  );
}
