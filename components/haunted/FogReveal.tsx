"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { useIsoLayoutEffect } from "@/components/motion/useIsoLayoutEffect";

type FogRevealProps = {
  children: React.ReactNode;
  className?: string;
  blur?: number; // стартовое размытие, px
  start?: string;
};

// «Проявление из тумана» (§8) — blur+opacity при входе в кадр. Тот же латч, что в
// Reveal (показанное не перепрятываем — устойчиво к тумблеру). Под reduced —
// статично-видимо. Применяем к графике (не к прозе — §5).
export function FogReveal({
  children,
  className,
  blur = 10,
  start = "top 80%",
}: FogRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionSafe();
  const revealed = useRef(false);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced || revealed.current) {
      gsap.set(el, { clearProps: "opacity,filter" });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from(el, {
        opacity: 0,
        filter: `blur(${blur}px)`,
        duration: 1.0,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start,
          once: true,
          invalidateOnRefresh: true,
          onEnter: () => {
            revealed.current = true;
          },
        },
      });
    }, el);
    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, [reduced, blur, start]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
