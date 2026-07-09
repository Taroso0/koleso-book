import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  type Force,
  type SimulationNodeDatum,
} from "d3-force";
import type { WheelGraph } from "./graph";

// Детерминированная укладка «Колеса» (§5/§11-B2). Чистая, без DOM — считается на
// сборке (RSC/SSG) и передаётся клиентскому острову пропсом. Никакой симуляции в
// рантайме. Темы зафиксированы по кольцу; рассказы оседают силами к своим темам
// (рассказ садится на пересечении своих тем — смысл «Колеса») и удерживаются
// внутри кольца (без выбросов за периметр).

export type Point = { x: number; y: number };
export type WheelLayout = Record<string, Point>; // id → позиция в системе VIEW

export const WHEEL_VIEW = { width: 1000, height: 760 } as const;

// Рассказы держим внутри кольца тем: доля от радиуса кольца (чуть внутри периметра).
const STORY_RING_FACTOR = 0.88;

// Длина покоя ребра «рассказ↔тема». Память «Колеса» укорачивает её у прочитанных
// (WheelLink.distanceScale) — так узел реально садится ближе к своим темам.
const LINK_DISTANCE = 90;

// На сколько px тема сдвигается внутрь кольца, если прочитаны ВСЕ её рассказы (opts.lean).
// Тема — закреплённый якорь укладки, поэтому её наклон тянет за собой её созвездие:
// Колесо кривится в сторону прочитанного. Одних рёбер для этого мало — рассказ с
// несколькими темами стоит в точке, где их тяги гасят друг друга.
const THEME_LEAN = 18;

type LayoutOpts = {
  width?: number;
  height?: number;
  seed?: number;
  iterations?: number;
  initial?: WheelLayout; // тёплый старт: позиции рассказов из готовой укладки
  anchor?: string; // id рассказа, закреплённого на месте (не уезжает из-под курсора)
  lean?: Record<string, number>; // тема → доля [0..1]: наклон внутрь кольца (память, §8)
};

type SimNode = SimulationNodeDatum & { id: string; kind: "theme" | "story" };
type SimLink = {
  source: string;
  target: string;
  weight: number;
  distanceScale?: number;
};

/** Детерминированный LCG-источник случайности в [0, 1). */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Удержать рассказы внутри кольца тем (радиус maxR от центра). Жёсткая проекция
 *  на окружность каждый тик + гашение скорости — детерминированно, без выбросов.
 *  Темы (fx/fy) и закреплённый якорь не трогаем. */
function forceContain(
  cx: number,
  cy: number,
  maxR: number,
): Force<SimNode, SimLink> {
  let nodes: SimNode[] = [];
  const force: Force<SimNode, SimLink> = () => {
    for (const n of nodes) {
      if (n.kind !== "story" || n.fx != null) continue;
      const dx = (n.x ?? cx) - cx;
      const dy = (n.y ?? cy) - cy;
      const r = Math.hypot(dx, dy);
      if (r > maxR) {
        const k = maxR / r;
        n.x = cx + dx * k;
        n.y = cy + dy * k;
        if (n.vx != null) n.vx *= 0.4;
        if (n.vy != null) n.vy *= 0.4;
      }
    }
  };
  force.initialize = (n) => {
    nodes = n;
  };
  return force;
}

export function computeWheelLayout(
  graph: WheelGraph,
  opts: LayoutOpts = {},
): WheelLayout {
  const W = opts.width ?? WHEEL_VIEW.width;
  const H = opts.height ?? WHEEL_VIEW.height;
  const iterations = opts.iterations ?? 400;
  const rng = lcg(opts.seed ?? 0x9e3779b9);

  const cx = W / 2;
  const cy = H / 2;
  const themeRadius = Math.min(W, H) * 0.4;

  const themeNodes = graph.nodes.filter((n) => n.kind === "theme");
  const storyNodes = graph.nodes.filter((n) => n.kind === "story");

  const nodes: SimNode[] = [
    ...themeNodes.map((t, i): SimNode => {
      const angle = (i / themeNodes.length) * 2 * Math.PI - Math.PI / 2;
      // «начатая» тема притягивается внутрь кольца ∝ доле прочитанного (§8)
      const r = themeRadius - THEME_LEAN * clamp(opts.lean?.[t.id] ?? 0, 0, 1);
      return {
        id: t.id,
        kind: "theme",
        fx: cx + r * Math.cos(angle), // тема зафиксирована по кольцу
        fy: cy + r * Math.sin(angle),
      };
    }),
    ...storyNodes.map((s): SimNode => {
      const seed = opts.initial?.[s.id];
      // Активный рассказ закреплён на своём месте — колесо строится вокруг него,
      // а сам узел не уезжает из-под курсора (иначе hover «убегает» в петле).
      if (opts.anchor === s.id && seed) {
        return { id: s.id, kind: "story", fx: seed.x, fy: seed.y };
      }
      return {
        id: s.id,
        kind: "story",
        x: seed?.x ?? cx + (rng() - 0.5) * 60, // тёплый старт или детерм. джиттер
        y: seed?.y ?? cy + (rng() - 0.5) * 60,
      };
    }),
  ];

  const links: SimLink[] = graph.links.map((l) => ({
    source: l.source,
    target: l.target,
    weight: l.weight,
    distanceScale: l.distanceScale,
  }));

  const simulation = forceSimulation<SimNode, SimLink>(nodes)
    .randomSource(rng)
    .force(
      "link",
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        // база 90 неизменна; память укорачивает длину покоя → узел садится к теме
        .distance((l) => LINK_DISTANCE * (l.distanceScale ?? 1))
        // вес=1 → 0.45 (база неизменна); усиленные рёбра тянут сильнее (до 0.9)
        .strength((l) => Math.min(0.9, 0.45 * l.weight)),
    )
    .force("charge", forceManyBody<SimNode>().strength(-150))
    .force("collide", forceCollide<SimNode>(20))
    .force("x", forceX<SimNode>(cx).strength(0.02))
    .force("y", forceY<SimNode>(cy).strength(0.02))
    .force("contain", forceContain(cx, cy, themeRadius * STORY_RING_FACTOR))
    .stop();

  for (let i = 0; i < iterations; i++) simulation.tick();

  // Финальный радиальный клэмп рассказов — жёсткая гарантия «внутри кольца»
  // (сила оседает плавно, но интеграция d3 может оставить суб-пиксельный овершут).
  const maxR = themeRadius * STORY_RING_FACTOR;
  const layout: WheelLayout = {};
  for (const n of nodes) {
    let x = clamp(n.x ?? cx, 24, W - 24);
    let y = clamp(n.y ?? cy, 24, H - 24);
    if (n.kind === "story") {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.hypot(dx, dy);
      if (r > maxR) {
        const k = maxR / r;
        x = cx + dx * k;
        y = cy + dy * k;
      }
    }
    layout[n.id] = { x, y };
  }
  return layout;
}
