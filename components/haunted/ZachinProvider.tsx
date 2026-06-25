"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { ZachinContext, type OpeningStory } from "./zachinContext";
import { StoryOpening } from "./StoryOpening";

// Размещение зачина (решение B): «первая строка как событие» проигрывается при
// входе из «Колеса» — интерстишл поверх «Витрины», затем переход в Читальню.
// Читальня НЕ трогается (остаётся статичной). Под reduced-motion оверлея нет —
// мгновенный переход (статичный паритет). Оверлей декоративный (aria-hidden);
// Esc/клик — скип. Канон-навигация (WheelIndex) идёт прямыми ссылками мимо зачина.
export function ZachinProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const reduced = useReducedMotionSafe();
  const [active, setActive] = useState<OpeningStory | null>(null);
  const navigated = useRef(false);

  const dest = active ? `/read/${active.book}/${active.slug}` : null;

  const go = useCallback(() => {
    if (navigated.current || !dest) return;
    navigated.current = true;
    router.push(dest);
  }, [dest, router]);

  const playOpening = useCallback(
    (s: OpeningStory) => {
      const d = `/read/${s.book}/${s.slug}`;
      if (reduced) {
        router.push(d); // статичный паритет — мгновенный вход к рассказу
        return;
      }
      navigated.current = false;
      router.prefetch(d);
      setActive(s);
    },
    [reduced, router],
  );

  // Esc — скип события (глобально, пока оверлей активен).
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") go();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, go]);

  return (
    <ZachinContext.Provider value={{ playOpening }}>
      {children}
      <AnimatePresence>
        {active && (
          <motion.div
            aria-hidden
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-8 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={go}
          >
            <StoryOpening
              key={active.slug}
              text={active.firstLine}
              slug={active.slug}
              className="max-w-2xl text-center font-serif text-2xl leading-snug text-foreground text-balance sm:text-3xl"
              onDone={go}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ZachinContext.Provider>
  );
}
