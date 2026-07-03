"use client";

import { useMemo } from "react";
import Link from "next/link";
import { themes } from "@/content/themes";
import { useHauntedCapability } from "@/components/haunted/useHauntedCapability";

// «Тёплое окно» — арт-директированный первый экран «Витрины» (§4/§8/§10): одинокое тёплое
// окно (горит с ПЕРВОГО пикселя, не на :hover) в холодной ночной громаде здания — свет по
// Хопперу. Сцена статична и полностью читаема без JS; useHauntedCapability добавляет
// data-haunt только на способном десктопе при разрешённом движении → включаются CSS-keyframes
// (мерцание окна, пульс ореола, курсор). Корень несёт .dark → видимый фокус
// работает на тёмной сцене. Зерно — глобальный GrainOverlay из (vitrina)/layout, тут не дублируем.

const COLD_PANES = new Set([2, 9]); // окна с «системным» свечением монитора (§4 «Машина»)

// Тизер-«Колесо» на стене (§4/§8): кольцо с ВЕСОМ + один горящий путь — тема макс.
// степени (та же, что горит в графе ниже; вычисляется из degrees, не хардкод → после
// вычитки themes[] пересоберётся сам). Детерминированная укладка (seed) → одинакова на
// сервере и клиенте (без hydration-mismatch). Декоративный SVG, реального графа не
// заменяет; статичен (движется только тёплое окно — §10).
function buildHint(degrees: Record<string, number>) {
  const CX = 120;
  const CY = 116;
  const R = 86;
  const clampR = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v));

  const ring = themes.map((t, i) => {
    const ang = -Math.PI / 2 + (i / themes.length) * Math.PI * 2;
    const deg = degrees[t.id] ?? 0;
    return {
      ...t,
      ang,
      deg,
      x: CX + Math.cos(ang) * R,
      y: CY + Math.sin(ang) * R,
      r: clampR(2.5 + deg * 0.28, 2.5, 8.5), // вес → радиус узла
    };
  });
  // горит тема макс. степени (тай-брейк — канон-порядок: reduce с «>» держит первую)
  const lit = ring.reduce((best, t) => (t.deg > best.deg ? t : best), ring[0]);

  // крошечный детерминированный ГПСЧ (mulberry32) — фиксированный seed → стабильная сцена
  let seed = 21;
  const rnd = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // пыль горящего пути (тянется к лит-теме) + тихая пыль (к случайным темам)
  const litDust = Array.from({ length: 7 }, () => {
    const k = 0.32 + rnd() * 0.5;
    return {
      x: CX + (lit.x - CX) * k + (rnd() - 0.5) * 14,
      y: CY + (lit.y - CY) * k + (rnd() - 0.5) * 14,
      lit: true,
    };
  });
  const links = litDust.map((d) => ({
    x1: d.x,
    y1: d.y,
    x2: lit.x,
    y2: lit.y,
    lit: true,
  }));
  const quiet = Array.from({ length: 6 }, () => {
    const t = ring[Math.floor(rnd() * ring.length)];
    const k = 0.3 + rnd() * 0.5;
    const x = CX + (t.x - CX) * k + (rnd() - 0.5) * 16;
    const y = CY + (t.y - CY) * k + (rnd() - 0.5) * 16;
    links.push({ x1: x, y1: y, x2: t.x, y2: t.y, lit: false }); // холодное ребро
    return { x, y, lit: false };
  });

  return { ring, dust: [...litDust, ...quiet], links, litId: lit.id };
}

export function WarmWindowHero({
  degrees,
}: {
  degrees: Record<string, number>;
}) {
  const { level } = useHauntedCapability();
  const haunted = level === "full";
  // тизер зависит только от степеней (build-time) — стабилен между рендерами
  const { ring, dust, links, litId } = useMemo(
    () => buildHint(degrees),
    [degrees],
  );

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

      <div className="vignette" aria-hidden />

      {/* «созвездие» тем — декоративный тизер «Колеса» (точка входа, не лаборатория):
          кольцо с весом, горит тема макс. степени = карта ниже. Статичен (§10). */}
      <div className="wheel-hint" aria-hidden>
        <svg viewBox="0 0 240 240">
          {links.map((l, i) => (
            <line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              className={l.lit ? "st-link lit" : "st-link"}
            />
          ))}
          {dust.map((d, i) => (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={d.lit ? 2.4 : 1.8}
              className={d.lit ? "st-node lit" : "st-node"}
            />
          ))}
          {ring.map((t) => {
            const lit = t.id === litId;
            const right = Math.cos(t.ang) >= 0;
            return (
              <g key={t.id}>
                {lit && (
                  <circle cx={t.x} cy={t.y} r={t.r + 5} className="th-halo" />
                )}
                <circle
                  cx={t.x}
                  cy={t.y}
                  r={t.r}
                  className={lit ? "th-ring lit" : "th-ring"}
                />
                {lit && (
                  <text
                    x={t.x + (right ? t.r + 6 : -(t.r + 6))}
                    y={t.y + 3.5}
                    textAnchor={right ? "start" : "end"}
                    className="th-label lit"
                  >
                    {t.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <span className="cap">↗ колесо · точка входа</span>
      </div>

      {/* реальный контент сцены */}
      <div className="copy">
        <p className="kicker">
          03:14 · опенспейс пуст · кто-то не выключил свет&nbsp;
          <span className="cur" aria-hidden>
            ▍
          </span>
        </p>
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
