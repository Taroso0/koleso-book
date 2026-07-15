"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useHydrated } from "./useHydrated";

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
  const hydrated = useHydrated();
  // Источник правды тумблера — localStorage; читаем его после гидратации (без
  // setState-в-effect и без hydration-mismatch: сервер и первый рендер → false).
  // `toggle` — ручное переопределение в этой сессии (null = ещё не трогали).
  const [toggle, setToggle] = useState<boolean | null>(null);
  const reduceEffects =
    toggle ?? (hydrated && localStorage.getItem(STORAGE_KEY) === "1");

  // Мостик ручного тумблера в CSS: чистые CSS-эффекты (напр. разворачивание
  // списков «Колеса») гейтятся через :root[data-reduce-effects]. ОС-настройку
  // они ловят сами через @media prefers-reduced-motion; здесь — ручной тумблер.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-reduce-effects", reduceEffects);
  }, [reduceEffects]);

  const setReduceEffects = (v: boolean) => {
    setToggle(v);
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
