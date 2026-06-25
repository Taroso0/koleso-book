"use client";

import { useEffect, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { useHauntedCapability } from "./useHauntedCapability";

// Кастомный курсор «одержимого интерфейса» (§4/§8): натриевая точка (мгновенно) +
// кольцо с лагом; над интерактивными элементами кольцо растёт. Только десктоп/
// fine-pointer и уровень «full»; под reduced/тач — нативный курсор (не рендерится).
// Чисто визуально — клавиатура и фокус не затрагиваются.
export function CustomCursor() {
  const { level, pointerFine } = useHauntedCapability();
  const active = level === "full" && pointerFine;

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 320, damping: 28, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 320, damping: 28, mass: 0.6 });
  const dotTransform = useMotionTemplate`translate(-50%, -50%) translate(${x}px, ${y}px)`;
  const ringTransform = useMotionTemplate`translate(-50%, -50%) translate(${ringX}px, ${ringY}px)`;
  const [hot, setHot] = useState(false);

  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    const prev = root.style.cursor;
    root.style.cursor = "none";

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as Element | null;
      setHot(Boolean(t?.closest("a,button,[role=link],[role=button],input,label,summary")));
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      root.style.cursor = prev;
    };
  }, [active, x, y]);

  if (!active) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 rounded-full bg-sodium"
        style={{ transform: dotTransform }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full border border-sodium"
        style={{ transform: ringTransform }}
        animate={{
          width: hot ? 44 : 26,
          height: hot ? 44 : 26,
          opacity: hot ? 0.5 : 0.8,
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
    </>
  );
}
