"use client";

import { useContext } from "react";
import { useReducedMotion } from "motion/react";
import { MotionContext } from "./MotionProvider";

/**
 * Единый шлюз движения (§7). Возвращает true, если движение надо снижать:
 * ОС prefers-reduced-motion ИЛИ ручной тумблер «снизить эффекты».
 *
 * ВСЕ анимации, грейн, фликер и parallax обязаны спрашивать этот хук и иметь
 * полноценный статический сценарий, а не просто «выключено».
 *
 * Работает и без <MotionProvider> — тогда учитывает только ОС-настройку.
 */
export function useReducedMotionSafe(): boolean {
  const ctx = useContext(MotionContext);
  const osReduced = useReducedMotion();
  return ctx ? ctx.reduced : Boolean(osReduced);
}
