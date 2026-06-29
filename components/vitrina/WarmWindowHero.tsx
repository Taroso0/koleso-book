"use client";

import Link from "next/link";
import { themes } from "@/content/themes";
import { useHauntedCapability } from "@/components/haunted/useHauntedCapability";

// «Тёплое окно» — арт-директированный первый экран «Витрины» (§4/§8/§10): одинокое тёплое
// окно (горит с ПЕРВОГО пикселя, не на :hover) в холодной ночной громаде здания — свет по
// Хопперу. Сцена статична и полностью читаема без JS; useHauntedCapability добавляет
// data-haunt только на способном десктопе при разрешённом движении → включаются CSS-keyframes
// (мерцание окна, пульс ореола, курсор, «дыхание» узла). Корень несёт .dark → видимый фокус
// работает на тёмной сцене. Зерно — глобальный GrainOverlay из (vitrina)/layout, тут не дублируем.

const COLD_PANES = new Set([2, 9]); // окна с «системным» свечением монитора (§4 «Машина»)
const LIT_THEME = "Свет"; // одна тема горит акцентом и «дышит» — намёк на «Колесо»

// Детерминированная укладка «созвездия» — одинаковая на сервере и клиенте (без
// hydration-mismatch). Та же тригонометрия, что в референсе, но без интерактива/d3:
// чисто декоративный SVG-тизер «точки входа», а реальный граф «Колеса» — ниже по странице.
function buildConstellation() {
  const CX = 150;
  const CY = 150;
  const R = 104;
  const STORY_COUNT = 16;
  let seed = 21;

  const ring = themes.map((t, i) => {
    const ang = -Math.PI / 2 + (i / themes.length) * Math.PI * 2;
    return { ...t, x: CX + Math.cos(ang) * R, y: CY + Math.sin(ang) * R, ang };
  });

  // крошечный детерминированный ГПСЧ (mulberry32) — фиксированный seed → стабильная сцена
  const rnd = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const stories = Array.from({ length: STORY_COUNT }, () => {
    const ang = rnd() * Math.PI * 2;
    const r = R * (0.18 + rnd() * 0.66);
    return { x: CX + Math.cos(ang) * r, y: CY + Math.sin(ang) * r };
  });

  const nearest = (s: { x: number; y: number }) =>
    [...ring].sort(
      (p, q) =>
        Math.hypot(p.x - s.x, p.y - s.y) - Math.hypot(q.x - s.x, q.y - s.y),
    )[0];

  const links = stories.map((s) => {
    const t = nearest(s);
    return { x1: s.x, y1: s.y, x2: t.x, y2: t.y, lit: t.label === LIT_THEME };
  });

  return { ring, stories, links };
}

const { ring, stories, links } = buildConstellation();

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

      <div className="vignette" aria-hidden />

      {/* «созвездие» тем — декоративный тизер «Колеса» (точка входа, не лаборатория) */}
      <div className="wheel-hint" aria-hidden>
        <svg viewBox="0 0 300 300">
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
          {stories.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={2.6} className="st-node" />
          ))}
          {ring.map((t) => {
            const lit = t.label === LIT_THEME;
            const right = Math.cos(t.ang) >= 0;
            return (
              <g key={t.id}>
                <circle
                  cx={t.x}
                  cy={t.y}
                  r={lit ? 8 : 6}
                  className={lit ? "th-ring breathe lit" : "th-ring breathe"}
                />
                {lit && (
                  <text
                    x={t.x + (right ? 13 : -13)}
                    y={t.y + 4}
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
