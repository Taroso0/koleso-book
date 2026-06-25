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
    if (!el) return;

    const targets = stagger
      ? gsap.utils.toArray<HTMLElement>(el.children)
      : [el];

    if (reduced) {
      // Тумблер reduced-motion мог быть включён в рантайме — снять инлайновые
      // стили GSAP, чтобы контент гарантированно остался видимым (а не «исчез»).
      gsap.set(targets, { clearProps: "opacity,transform" });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    // from-твин: revert() возвращает к ВИДИМОМУ конечному состоянию (а set+to
    // откатывал бы к opacity:0 — отсюда был баг исчезновения при тумблере).
    const ctx = gsap.context(() => {
      gsap.from(targets, {
        opacity: 0,
        y,
        duration: 0.6,
        ease: "power2.out",
        stagger,
        scrollTrigger: { trigger: el, start, once, invalidateOnRefresh: true },
      });
    }, el);
    // Зажечь триггеры, уже находящиеся в кадре (важно при включении движения
    // обратно тумблером, когда блок уже на экране — иначе остался бы скрытым).
    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, [reduced, y, stagger, start, once]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
