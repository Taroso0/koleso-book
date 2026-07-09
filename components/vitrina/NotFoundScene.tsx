"use client";

import Link from "next/link";
import { GlitchText } from "@/components/haunted/GlitchText";
import { systemVoice } from "@/content/systemVoice";

// Сцена 404 (§5/§6): «404» разрядом (машина, GlitchText — один проход, reduced-паритет
// внутри), а реплика §6 — серифом (душа). Тёплое окно на краю — «замечено боковым
// зрением» (метафора сайта). Класс `dark` несёт «офисную готику» сам: корневой not-found
// рендерится под КОРНЕВЫМ layout, без слоя «Витрины» (зерно/курсор/Lenis сюда не доходят).
// play — только для статичных снимков (превью дизайн-системы): разряд длится 1.8 с, кадр
// поймал бы «404» на середине. На живой странице остаётся дефолт.
export function NotFoundScene({ play = true }: { play?: boolean }) {
  return (
    <main id="main" tabIndex={-1} className="notfound dark">
      <div className="notfound__periph" aria-hidden />
      <p className="notfound__eyebrow font-mono">Ошибка · маршрут не найден</p>
      <GlitchText text="404" className="notfound__code" play={play} />
      <p className="notfound__line font-serif">{systemVoice.notFound}</p>
      <p className="notfound__back font-mono">
        <Link href="/">← вернуться к Колесу</Link>
      </p>
    </main>
  );
}
