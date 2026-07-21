"use client";

import { useEffect } from "react";
import { fontProse, fontSystem, fontMono } from "@/lib/fonts";
import { ErrorScene } from "@/components/vitrina/ErrorScene";
import "./globals.css";

// Последний рубеж: ошибка в САМОМ корневом layout. Next заменяет им всё дерево,
// поэтому <html>/<body> и шрифты приходится объявлять здесь заново — от app/layout.tsx
// в этот момент уже ничего не осталось. MotionProvider сознательно не подключаем:
// он и мог оказаться причиной. GlitchText это переживёт — useReducedMotionSafe без
// провайдера читает ОС-настройку напрямую (штатный фолбэк, см. его док-комментарий).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Ошибка корневого layout:", error.digest ?? error);
  }, [error]);

  return (
    <html
      lang="ru"
      className={`${fontProse.variable} ${fontSystem.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ErrorScene reset={reset} />
      </body>
    </html>
  );
}
