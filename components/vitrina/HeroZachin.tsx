"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { useIsoLayoutEffect } from "@/components/motion/useIsoLayoutEffect";
import type { OpeningVariant } from "@/components/haunted/StoryOpening";

const StoryOpening = dynamic(
  () => import("@/components/haunted/StoryOpening").then((m) => m.StoryOpening),
  { ssr: false },
);

export const ZACHIN_HERO_KEY = "zachin:hero";
const REDUCE_KEY = "kirilov:reduce-effects"; // ручной тумблер (см. MotionProvider)
const BREATH_MS = 250; // «выдох» перед событием
const FONTS_CAP_MS = 900; // страховка, если fonts.ready задержится

type Phase = "static" | "armed" | "play" | "done";

// «Первая строка как событие» на входе (§5/§9). Фазы:
// static — строка видима (SSR, no-JS, reduced, повторный визит);
// armed  — строка скрыта (visibility), ждём шрифты+чанк — высота держится, CLS 0;
// play   — смонтирован StoryOpening, каскад играет;
// done   — обратно статичная строка; курсор мигает, черта прочерчена (CSS).
export function HeroZachin({
  text,
  variant = "cascade",
}: {
  text: string;
  variant?: OpeningVariant;
}) {
  const reduced = useReducedMotionSafe();
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("static");

  // Фаза → data-атрибут на секции героя (CSS: курсор ждёт, черта — после).
  // Атрибут не рендерится ни в одном JSX → императивная запись безопасна
  // (React не трогает неизвестные ему атрибуты).
  useEffect(() => {
    const hero = rootRef.current?.closest<HTMLElement>(".warm-hero");
    if (!hero) return;
    if (phase === "static") delete hero.dataset.zachin;
    else hero.dataset.zachin = phase === "armed" ? "play" : phase;
  }, [phase]);

  useIsoLayoutEffect(() => {
    // Снять пре-пейнт гейт inline-скрипта (см. WarmWindowHero) в ЛЮБОМ исходе.
    const unboot = () =>
      document.documentElement.removeAttribute("data-zachin-boot");

    // Состояние reduced читаем СИНХРОННО (MQ + ручной тумблер): значение хука на
    // маунте может отставать (reduceEffects из localStorage выставляется пассивным
    // эффектом MotionProvider ПОЗЖЕ этого layout-эффекта). Без этого каскад проиграл
    // бы вопреки тумблеру «снизить эффекты» — нарушив паритет reduced-motion.
    let reduceNow = false;
    let saveData = false;
    let played = false;
    try {
      const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
      reduceNow =
        matchMedia("(prefers-reduced-motion: reduce)").matches ||
        localStorage.getItem(REDUCE_KEY) === "1";
      saveData =
        Boolean(nav.connection?.saveData) ||
        matchMedia("(prefers-reduced-data: reduce)").matches;
      played = Boolean(sessionStorage.getItem(ZACHIN_HERO_KEY));
    } catch {
      /* приватный режим и т.п. — считаем, что играть можно */
    }

    if (reduced || reduceNow || saveData || played) {
      unboot(); // статичный паритет: строка видима, дальше ничего
      return;
    }
    try {
      sessionStorage.setItem(ZACHIN_HERO_KEY, "1"); // событие одно на сессию
    } catch {}

    setPhase("armed"); // строка скрыта, высота держится
    unboot();

    let alive = true;
    let timer = 0;
    // Чанк и шрифты — параллельно; играть, когда готовы ОБА (SplitText мерит
    // реальные глифы; дозагрузка чанка не покажет fallback-мигание).
    const chunk = import("@/components/haunted/StoryOpening");
    const fonts = new Promise<void>((res) => {
      const cap = window.setTimeout(res, FONTS_CAP_MS);
      document.fonts?.ready.then(() => {
        window.clearTimeout(cap);
        res();
      });
    });
    Promise.all([chunk, fonts])
      .then(() => {
        if (!alive) return;
        timer = window.setTimeout(() => alive && setPhase("play"), BREATH_MS);
      })
      .catch(() => {
        if (alive) setPhase("static"); // чанк не доехал (оффлайн) — статик
      });

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []); // однократно на маунте

  return (
    <div ref={rootRef} className="zwrap">
      {phase === "play" ? (
        <StoryOpening
          text={text}
          variant={variant}
          className="zline"
          onDone={() => setPhase("done")}
        />
      ) : (
        <p
          className="zline"
          style={{ visibility: phase === "armed" ? "hidden" : undefined }}
        >
          {text}
        </p>
      )}
    </div>
  );
}
