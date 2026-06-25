import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from "d3-force";
import type { WheelGraph } from "./graph";

// Детерминированная укладка «Колеса» (§5/§11-B2). Чистая, без DOM — считается на
// сборке (RSC/SSG) и передаётся клиентскому острову пропсом. Никакой симуляции в
// рантайме. Темы зафиксированы по кольцу; рассказы оседают силами к своим темам
// (рассказ садится на пересечении своих тем — смысл «Колеса»).

export type Point = { x: number; y: number };
export type WheelLayout = Record<string, Point>; // id → позиция в системе VIEW

export const WHEEL_VIEW = { width: 1000, height: 760 } as const;

type LayoutOpts = {
  width?: number;
  height?: number;
  seed?: number;
  iterations?: number;
};

type SimNode = SimulationNodeDatum & { id: string; kind: "theme" | "story" };
type SimLink = { source: string; target: string };

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
      return {
        id: t.id,
        kind: "theme",
        fx: cx + themeRadius * Math.cos(angle), // тема зафиксирована по кольцу
        fy: cy + themeRadius * Math.sin(angle),
      };
    }),
    ...storyNodes.map(
      (s): SimNode => ({
        id: s.id,
        kind: "story",
        x: cx + (rng() - 0.5) * 60, // детерминированный старт у центра
        y: cy + (rng() - 0.5) * 60,
      }),
    ),
  ];

  const links: SimLink[] = graph.links.map((l) => ({
    source: l.source,
    target: l.target,
  }));

  const simulation = forceSimulation<SimNode, SimLink>(nodes)
    .randomSource(rng)
    .force(
      "link",
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance(90)
        .strength(0.45),
    )
    .force("charge", forceManyBody<SimNode>().strength(-150))
    .force("collide", forceCollide<SimNode>(20))
    .force("x", forceX<SimNode>(cx).strength(0.02))
    .force("y", forceY<SimNode>(cy).strength(0.02))
    .stop();

  for (let i = 0; i < iterations; i++) simulation.tick();

  const layout: WheelLayout = {};
  for (const n of nodes) {
    layout[n.id] = {
      x: clamp(n.x ?? cx, 24, W - 24),
      y: clamp(n.y ?? cy, 24, H - 24),
    };
  }
  return layout;
}
