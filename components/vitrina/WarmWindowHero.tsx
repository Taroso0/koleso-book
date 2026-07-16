"use client";

import Link from "next/link";
import { useHauntedCapability } from "@/components/haunted/useHauntedCapability";
import { HeroZachin } from "./HeroZachin";

const KICKER_LINE = "03:14 · опенспейс пуст · кто-то не выключил свет";

// «Тёплое окно» — арт-директированный первый экран «Витрины» (§4/§8/§10): одинокое тёплое
// окно (горит с ПЕРВОГО пикселя, не на :hover) в холодной ночной громаде здания — свет по
// Хопперу. Сцена статична и полностью читаема без JS; useHauntedCapability добавляет
// data-haunt только на способном десктопе при разрешённом движении → включаются CSS-keyframes
// (мерцание окна, пульс ореола, курсор). Корень несёт .dark → видимый фокус
// работает на тёмной сцене. Зерно — глобальный GrainOverlay из (vitrina)/layout, тут не дублируем.

const COLD_PANES = new Set([2, 9]); // окна с «системным» свечением монитора (§4 «Машина»)

export function WarmWindowHero() {
  const { level } = useHauntedCapability();
  const haunted = level === "full";

  return (
    <section
      className="warm-hero dark"
      data-haunt={haunted ? "true" : undefined}
    >
      {/* холодная громада здания — сетка тёмных окон, пара «системно» горящих */}
      <div className="facade" aria-hidden>
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className={COLD_PANES.has(i) ? "pane cold" : "pane"} />
        ))}
      </div>

      {/* тёплый воздух (Хоппер) + косой клин света на «пол» */}
      <div className="ambient" aria-hidden />
      <div className="spill" aria-hidden />

      {/* единственное тёплое окно — горит статично */}
      <div className="warm" aria-hidden>
        <div className="bloom" />
        <div className="frame">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      {/* Логотип-трафарет «Наблюдатель» (§8/§10) — знак-марка на стене фасада, заменяет
          прежний мини-тизер Колеса. Тон «Чернила», нанесён трафаретом (PNG-маска с
          альфой красится в --ink-soft). Лежит ПОД виньеткой в DOM (её z:6 выше) —
          свет виньетки ложится и на знак. Статичен; на <900px скрыт (CSS). */}
      <div className="hero-logo" aria-hidden>
        <div className="stencil" />
        <p className="cap">⌁ Колесо · точка входа</p>
      </div>

      <div className="vignette" aria-hidden />

      {/* реальный контент сцены */}
      <div className="copy">
        {/* кикер — <div> (StoryOpening рендерит свой <p>, p-в-p невалиден). Первая
            строка собирается каскадом на входе (§5/§9) через HeroZachin. Пре-пейнт
            boot-гейт (ZACHIN_BOOT) живёт в серверном page.tsx — не в этом клиентском
            компоненте (React 19 не исполняет <script> в клиентском дереве). */}
        <div className="kicker">
          <HeroZachin text={KICKER_LINE} />
          &nbsp;
          <span className="cur" aria-hidden>
            ▍
          </span>
        </div>
        <h1 className="title">Боковым зрением</h1>
        <div className="accent-rule" aria-hidden />
        <p className="sub">
          Чудо живёт не в космосе, а в обыденном — в офисе, фонаре, на скамейке.
          Его видно боковым зрением.
        </p>
        <div className="foot">
          <a href="#wheel">
            ↓ блуждать по <b>Колесу</b>
          </a>
          <Link href="/read">
            ⌥ уйти в <b>Читальню</b>
          </Link>
        </div>
      </div>
    </section>
  );
}
