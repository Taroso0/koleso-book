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

// Тизер-«Колесо» на стене (§4/§8): кольцо с ВЕСОМ (пунктирная орбита) + ОДИН горящий
// путь — ломаная цепочка хаб → 2 излома → тема макс. степени (та же, что горит в графе
// ниже; вычисляется из degrees, не хардкод → после вычитки themes[] пересоберётся сам).
// Тихие «рассказы» — короткие спицы у своих тем, не пыль через всё кольцо.
// Детерминированная укладка (mulberry32, seed 21 — проверен: изломы ≥22px от узлов
// кольца) → одинакова на сервере и клиенте (без hydration-mismatch). Декоративный SVG,
// реального графа не заменяет; статичен (движется только тёплое окно — §10).
function buildHint(degrees: Record<string, number>) {
  const CX = 120;
  const CY = 118;
  const R = 84;
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
      r: clampR(2 + deg * 0.22, 2, 6), // вес → радиус, без жирного блоба
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

  // ОДИН горящий путь: центр → 2 излома → горящая тема (цепочка, не звезда);
  // изломы смещены вдоль нормали к лучу — путь читается как маршрут
  const nx = -(lit.y - CY);
  const ny = lit.x - CX;
  const nlen = Math.hypot(nx, ny) || 1;
  const bends = [0.34, 0.66].map((k) => {
    const off = (rnd() - 0.5) * 26;
    return {
      x: CX + (lit.x - CX) * k + (nx / nlen) * off,
      y: CY + (lit.y - CY) * k + (ny / nlen) * off,
      lit: true,
    };
  });
  const chain = [{ x: CX, y: CY }, ...bends, { x: lit.x, y: lit.y }];
  const links = chain.slice(1).map((p, i) => ({
    x1: chain[i].x,
    y1: chain[i].y,
    x2: p.x,
    y2: p.y,
    lit: true,
  }));

  // тихие «рассказы»: по одной точке у КАЖДОЙ 2-й негорящей темы,
  // коротким штрихом к СВОЕЙ теме (спица), не через всё кольцо
  const quiet = ring
    .filter((t) => t.id !== lit.id)
    .filter((_, i) => i % 2 === 0)
    .slice(0, 4)
    .map((t) => {
      const k = 0.72 + rnd() * 0.12; // близко к теме
      const x = CX + (t.x - CX) * k;
      const y = CY + (t.y - CY) * k;
      links.push({ x1: x, y1: y, x2: t.x, y2: t.y, lit: false }); // холодная спица
      return { x, y, lit: false };
    });

  return { ring, dust: [...bends, ...quiet], links, litId: lit.id, CX, CY, R };
}

export function WarmWindowHero({
  degrees,
}: {
  degrees: Record<string, number>;
}) {
  const { level } = useHauntedCapability();
  const haunted = level === "full";
  // тизер зависит только от степеней (build-time) — стабилен между рендерами
  const { ring, dust, links, litId, CX, CY, R } = useMemo(
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
          кольцо с весом на пунктирной орбите, горящий путь хаб→тема макс. степени =
          карта ниже. Лежит на «тихой стене» (::before гасит сетку окон). Статичен (§10). */}
      <div className="wheel-hint" aria-hidden>
        <svg viewBox="0 0 240 240">
          {/* орбита и хаб — первыми (под рёбрами) */}
          <circle cx={CX} cy={CY} r={R} className="th-orbit" />
          <circle cx={CX} cy={CY} r={2} className="st-node lit" />
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
                  <circle cx={t.x} cy={t.y} r={t.r + 4} className="th-halo" />
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
        {/* «↓» — реальный граф ниже по скроллу, не сбоку */}
        <span className="cap">↓ колесо · точка входа</span>
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
