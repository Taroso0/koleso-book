"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

type GlitchTextProps = {
  text: string;
  className?: string;
  play?: boolean; // запустить «разряд» (по умолчанию — на маунте)
  onDone?: () => void;
};

// Haunted-примитив «системного регистра» (§4/§7): один короткий «разряд» —
// натриевый и холодный клоны со срезами разъезжаются и гаснут, остаётся чистый
// текст. Базовый слой доступен (реальный текст); клоны — aria-hidden. Под
// reduced-motion — статичный текст. WCAG 2.3.1: один разряд, без цикла, мелкие
// смещения (нет >3 вспышек/сек).
const GLITCH_MS = 1800; // «разряд» + материализация текста (медленнее = дольше появляется)
const HOLD_MS = 750; // пауза с уже ЧИСТЫМ текстом перед переходом (больше = дольше держится)

export function GlitchText({ text, className, play = true, onDone }: GlitchTextProps) {
  const reduced = useReducedMotionSafe();
  const active = play && !reduced;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) {
      onDoneRef.current?.();
      return;
    }
    const t = window.setTimeout(() => onDoneRef.current?.(), GLITCH_MS + HOLD_MS);
    return () => clearTimeout(t);
  }, [active]);

  const slice = { duration: GLITCH_MS / 1000, ease: "easeOut" as const, times: [0, 0.2, 0.5, 0.8, 1] };

  return (
    <span className={cn("relative inline-block", className)}>
      {/* базовый текст медленно «материализуется» (под reduced — статичен) */}
      <motion.span
        className="relative z-10"
        initial={active ? { opacity: 0 } : false}
        animate={active ? { opacity: 1 } : undefined}
        transition={{ duration: (GLITCH_MS / 1000) * 0.8, ease: "easeOut" }}
      >
        {text}
      </motion.span>
      {active && (
        <>
          <motion.span
            aria-hidden
            className="absolute inset-0 text-sodium"
            style={{ clipPath: "inset(0 0 55% 0)" }}
            initial={{ x: 0, opacity: 0.75 }}
            animate={{ x: [0, -2, 2, -1, 0], opacity: [0.75, 0.7, 0.5, 0.25, 0] }}
            transition={slice}
          >
            {text}
          </motion.span>
          <motion.span
            aria-hidden
            className="absolute inset-0 text-[oklch(0.72_0.1_220)]"
            style={{ clipPath: "inset(55% 0 0 0)" }}
            initial={{ x: 0, opacity: 0.6 }}
            animate={{ x: [0, 2, -2, 1, 0], opacity: [0.6, 0.55, 0.4, 0.2, 0] }}
            transition={slice}
          >
            {text}
          </motion.span>
        </>
      )}
    </span>
  );
}
