"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

type MotionPref = {
  /** Итог: снижать движение (ОС prefers-reduced-motion ИЛИ ручной тумблер). */
  reduced: boolean;
  /** Ручной тумблер «снизить эффекты» (сверх ОС-настройки). */
  reduceEffects: boolean;
  setReduceEffects: (v: boolean) => void;
};

export const MotionContext = createContext<MotionPref | null>(null);

const STORAGE_KEY = "kirilov:reduce-effects";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const osReduced = useReducedMotion(); // реактивно к ОС-настройке
  const [reduceEffects, setReduceEffectsState] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") setReduceEffectsState(true);
  }, []);

  const setReduceEffects = (v: boolean) => {
    setReduceEffectsState(v);
    localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
  };

  const reduced = Boolean(osReduced) || reduceEffects;

  return (
    <MotionContext.Provider value={{ reduced, reduceEffects, setReduceEffects }}>
      {children}
    </MotionContext.Provider>
  );
}

/** Доступ к ручному тумблеру (для UI переключателя). */
export function useMotionPreference(): MotionPref {
  const ctx = useContext(MotionContext);
  if (!ctx) {
    throw new Error("useMotionPreference нужно использовать внутри <MotionProvider>");
  }
  return ctx;
}
