import type { Metadata } from "next";
import { NotFoundScene } from "@/components/vitrina/NotFoundScene";

export const metadata: Metadata = { title: "404 — Боковым зрением" };

// Корневой not-found ловит notFound() и неизвестные URL. ВАЖНО: он рендерится внутри
// КОРНЕВОГО app/layout.tsx, а НЕ (vitrina)/layout.tsx — значит НЕ получает
// SmoothScroll / GrainOverlay / CustomCursor / .vitrina-surface. Поэтому «офисную
// готику» (тёмный фон, натрий, окно) несёт сама NotFoundScene (класс dark + .notfound).
export default function NotFound() {
  return <NotFoundScene />;
}
