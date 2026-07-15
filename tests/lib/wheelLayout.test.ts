import { describe, it, expect } from "vitest";
import { computeWheelLayout, WHEEL_VIEW } from "@/lib/wheelLayout";
import { buildGraph } from "@/lib/graph";
import { themes } from "@/content/themes";
import type { Story } from "@/content/schema";

function story(slug: string, themeIds: Story["themes"]): Story {
  return {
    slug,
    title: slug,
    book: "koleso",
    order: 1,
    firstLine: "x",
    themes: themeIds,
    body: "",
  };
}

const graph = buildGraph(
  [story("a", ["soul", "light"]), story("b", ["death"]), story("c", ["soul"])],
  themes,
);

const cx = WHEEL_VIEW.width / 2;
const cy = WHEEL_VIEW.height / 2;
const maxR = Math.min(WHEEL_VIEW.width, WHEEL_VIEW.height) * 0.4 * 0.88;

describe("computeWheelLayout", () => {
  it("пустой граф → пустая укладка", () => {
    expect(computeWheelLayout({ nodes: [], links: [] })).toEqual({});
  });

  it("координата на каждый узел, без NaN, в пределах VIEW", () => {
    const layout = computeWheelLayout(graph);
    expect(Object.keys(layout)).toHaveLength(graph.nodes.length);
    for (const p of Object.values(layout)) {
      expect(Number.isNaN(p.x)).toBe(false);
      expect(Number.isNaN(p.y)).toBe(false);
      expect(p.x).toBeGreaterThanOrEqual(24);
      expect(p.x).toBeLessThanOrEqual(WHEEL_VIEW.width - 24);
      expect(p.y).toBeGreaterThanOrEqual(24);
      expect(p.y).toBeLessThanOrEqual(WHEEL_VIEW.height - 24);
    }
  });

  it("детерминированность при одном seed", () => {
    expect(computeWheelLayout(graph, { seed: 42 })).toEqual(
      computeWheelLayout(graph, { seed: 42 }),
    );
  });

  it("iterations: 0 — всё равно конечные координаты", () => {
    const layout = computeWheelLayout(graph, { iterations: 0 });
    for (const p of Object.values(layout)) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  it("рассказы держатся внутри кольца тем (радиус ≤ themeRadius·0.88)", () => {
    const layout = computeWheelLayout(graph);
    for (const s of ["a", "b", "c"]) {
      const r = Math.hypot(layout[s].x - cx, layout[s].y - cy);
      expect(r).toBeLessThanOrEqual(maxR + 0.001);
    }
  });

  it("тёплый старт: anchor + initial внутри кольца закрепляет позицию рассказа", () => {
    const layout = computeWheelLayout(graph, {
      anchor: "a",
      initial: { a: { x: 480, y: 360 } },
      iterations: 50,
    });
    expect(layout.a.x).toBeCloseTo(480);
    expect(layout.a.y).toBeCloseTo(360);
  });

  it("lean вне [0,1] клампится (узлы валидны, не бросает)", () => {
    const layout = computeWheelLayout(graph, { lean: { soul: 5, death: -3 } });
    expect(Number.isFinite(layout.soul.x)).toBe(true);
    expect(Number.isFinite(layout.death.x)).toBe(true);
  });
});
