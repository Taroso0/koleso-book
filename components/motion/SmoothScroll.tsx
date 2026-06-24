"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

/**
 * Инерционный скролл «Витрины» (§7). Связка Lenis ↔ ScrollTrigger.
 * Под reduced-motion НЕ инициализируется — нативный скролл (паритет, не «выключено»).
 * «Читальня» этот компонент не подключает (длинный текст несовместим с инерцией).
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    if (reduced) return; // нативный скролл

    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
}
