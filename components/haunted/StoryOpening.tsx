"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { useIsoLayoutEffect } from "@/components/motion/useIsoLayoutEffect";
import { GlitchText } from "./GlitchText";

// «Первая строка как событие» (§5/§9) — переиспользуемые шаблоны зачина (§11-F1).
// Кинетика — GSAP SplitText; «glitch» — через GlitchText. Под reduced-motion —
// статичный текст (SplitText не запускается, полный текст доступен).
export type OpeningVariant = "rise" | "cascade" | "glitch";
const VARIANTS: OpeningVariant[] = ["rise", "cascade", "glitch"];

/** Детерминированный шаблон по slug — чтобы не верстать 34 сцены вручную. */
export function openingVariant(slug: string): OpeningVariant {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (Math.imul(h, 31) + slug.charCodeAt(i)) >>> 0;
  return VARIANTS[h % VARIANTS.length];
}

const HOLD_MS = 280;

type StoryOpeningProps = {
  text: string;
  slug?: string; // источник варианта, если variant не задан
  variant?: OpeningVariant;
  className?: string;
  onDone?: () => void; // по завершении (overlay → навигация)
};

export function StoryOpening({ text, slug, variant, className, onDone }: StoryOpeningProps) {
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLParagraphElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const v: OpeningVariant = variant ?? (slug ? openingVariant(slug) : "rise");
  const kinetic = !reduced && v !== "glitch";

  // rise/cascade — SplitText по словам/буквам.
  useIsoLayoutEffect(() => {
    if (!kinetic) return;
    const el = ref.current;
    if (!el) return;

    gsap.registerPlugin(SplitText);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.setTimeout(() => onDoneRef.current?.(), HOLD_MS);
    };

    let split: SplitText | null = null;
    const ctx = gsap.context(() => {
      split = new SplitText(el, {
        // cascade: words,chars — буквы вложены в слова-обёртки (inline-block),
        // чтобы длинная строка (кикер hero, узкий десктоп/мобильный) не рвалась
        // ПОСРЕДИ слова. pieces ниже для cascade — по-прежнему split.chars.
        type: v === "cascade" ? "words,chars" : "words",
        aria: "auto",
      });
      const pieces = v === "cascade" ? split.chars : split.words;
      if (!pieces.length) return finish();
      gsap.from(pieces, {
        opacity: 0,
        y: v === "cascade" ? 8 : 16,
        stagger: v === "cascade" ? 0.015 : 0.045,
        duration: v === "cascade" ? 0.4 : 0.55,
        ease: "power2.out",
        onComplete: finish,
      });
    }, el);

    return () => {
      split?.revert();
      ctx.revert();
    };
  }, [kinetic, v, text]);

  // reduced (статичный текст): зачин показан мгновенно — отдать управление дальше.
  useEffect(() => {
    if (kinetic || v === "glitch") return; // обрабатывается выше / в GlitchText
    const t = window.setTimeout(() => onDoneRef.current?.(), HOLD_MS);
    return () => clearTimeout(t);
  }, [kinetic, v]);

  if (v === "glitch") {
    return <GlitchText text={text} className={className} play={!reduced} onDone={onDone} />;
  }

  return (
    <p ref={ref} className={className}>
      {text}
    </p>
  );
}
