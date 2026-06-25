"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotionSafe } from "./useReducedMotionSafe";
import { useIsoLayoutEffect } from "./useIsoLayoutEffect";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  y?: number; // начальный сдвиг вниз, по умолчанию 14
  stagger?: number; // если задан — стаггер прямых детей (сек), напр. 0.06
  start?: string; // ScrollTrigger start, по умолчанию "top 85%"
  once?: boolean; // по умолчанию true
};

// Скролл-проявление (§7): покой по умолчанию, при входе в кадр — мягкий fade+подъём.
// Оркестрация на GSAP ScrollTrigger (связан с Lenis в SmoothScroll). Под
// reduced-motion НЕ анимируем — контент сразу в финальном состоянии (паритет, не
// «выключено»). SSR рендерит детей видимыми → без JS контент на месте (a11y/SEO).
export function Reveal({
  children,
  className,
  y = 14,
  stagger,
  start = "top 85%",
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionSafe();

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return; // финальное состояние уже отрисовано

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const targets = stagger
        ? gsap.utils.toArray<HTMLElement>(el.children)
        : el;
      gsap.set(targets, { opacity: 0, y });
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger,
        scrollTrigger: { trigger: el, start, once, invalidateOnRefresh: true },
      });
    }, el);

    return () => ctx.revert(); // вернуть финальное состояние, снять триггеры
  }, [reduced, y, stagger, start, once]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
