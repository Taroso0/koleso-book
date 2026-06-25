"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "./useReducedMotionSafe";
import { useIsoLayoutEffect } from "./useIsoLayoutEffect";

type AccentLineProps = { className?: string; start?: string };

// Натриевый «мазок света» (§4/§7) — единственный «неправильный» тёплый акцент,
// прорисовывается отдельно от блока (scaleX слева). Декоративный (aria-hidden).
// Под reduced-motion виден статично — паритет, не «выключено».
export function AccentLine({ className, start = "top 85%" }: AccentLineProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotionSafe();

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.set(el, { scaleX: 0, transformOrigin: "left center" });
      gsap.to(el, {
        scaleX: 1,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start, once: true, invalidateOnRefresh: true },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced, start]);

  return (
    <span
      ref={ref}
      aria-hidden
      className={cn("block h-px w-16 bg-sodium", className)}
    />
  );
}
