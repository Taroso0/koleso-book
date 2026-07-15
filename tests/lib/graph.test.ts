import { describe, it, expect } from "vitest";
import {
  buildGraph,
  groupByTheme,
  themeDegree,
  reweight,
  reweightRead,
  readFractionByTheme,
  type WheelGraph,
} from "@/lib/graph";
import type { Story, Theme } from "@/content/schema";

function story(over: Partial<Story> & { slug: string }): Story {
  return {
    title: `Рассказ ${over.slug}`,
    book: "kolizey",
    order: 1,
    firstLine: "Первая строка.",
    themes: [],
    body: "",
    ...over,
  };
}

const themes: Theme[] = [
  { id: "soul", label: "Душа" },
  { id: "light", label: "Свет" },
  { id: "death", label: "Смерть" },
];

describe("buildGraph", () => {
  it("узлы: сначала темы, потом рассказы; рёбра рассказ→тема", () => {
    const g = buildGraph(
      [
        story({
          slug: "s1",
          title: "Раз",
          book: "koleso",
          firstLine: "Строка раз.",
          themes: ["soul", "light"],
        }),
      ],
      themes,
    );
    expect(g.nodes.map((n) => n.id)).toEqual(["soul", "light", "death", "s1"]);
    expect(g.nodes[0]).toMatchObject({ id: "soul", kind: "theme", label: "Душа" });
    expect(g.nodes.find((n) => n.id === "s1")).toMatchObject({
      kind: "story",
      label: "Раз",
      book: "koleso",
      firstLine: "Строка раз.",
    });
    expect(g.links).toEqual([
      { source: "s1", target: "soul", weight: 1 },
      { source: "s1", target: "light", weight: 1 },
    ]);
  });

  it("пустой ввод → пустой граф", () => {
    expect(buildGraph([], [])).toEqual({ nodes: [], links: [] });
  });

  it("рассказ без тем даёт узел, но не даёт рёбер", () => {
    const g = buildGraph([story({ slug: "s1", themes: [] })], themes);
    expect(g.nodes.some((n) => n.id === "s1")).toBe(true);
    expect(g.links).toEqual([]);
  });

  it("тема рассказа вне списка тем → висячее ребро (target без узла)", () => {
    const g = buildGraph([story({ slug: "s1", themes: ["rebirth"] })], themes);
    expect(g.nodes.some((n) => n.id === "rebirth")).toBe(false);
    expect(g.links).toEqual([{ source: "s1", target: "rebirth", weight: 1 }]);
  });

  it("дубли slug не дедуплицируются", () => {
    const g = buildGraph([story({ slug: "dup" }), story({ slug: "dup" })], []);
    expect(g.nodes.filter((n) => n.id === "dup")).toHaveLength(2);
  });
});

describe("groupByTheme", () => {
  it("тема → её рассказы; порядок тем как в nodes, рассказов как во входе", () => {
    const g = buildGraph(
      [
        story({ slug: "a", themes: ["soul"] }),
        story({ slug: "b", themes: ["soul", "light"] }),
      ],
      themes,
    );
    const grouped = groupByTheme(g);
    expect(grouped.map((x) => x.theme.id)).toEqual(["soul", "light", "death"]);
    expect(grouped[0].stories.map((s) => s.id)).toEqual(["a", "b"]);
    expect(grouped[1].stories.map((s) => s.id)).toEqual(["b"]);
    expect(grouped[2].stories).toEqual([]);
  });

  it("ребро с source без узла-рассказа молча отбрасывается", () => {
    const g: WheelGraph = {
      nodes: [{ id: "soul", kind: "theme", label: "Душа" }],
      links: [{ source: "нет-такого", target: "soul", weight: 1 }],
    };
    expect(groupByTheme(g)).toEqual([{ theme: g.nodes[0], stories: [] }]);
  });

  it("дубль ребра → дубль рассказа в группе", () => {
    const g: WheelGraph = {
      nodes: [
        { id: "soul", kind: "theme", label: "Душа" },
        { id: "a", kind: "story", label: "А" },
      ],
      links: [
        { source: "a", target: "soul", weight: 1 },
        { source: "a", target: "soul", weight: 1 },
      ],
    };
    expect(groupByTheme(g)[0].stories.map((s) => s.id)).toEqual(["a", "a"]);
  });
});

describe("themeDegree", () => {
  it("степень темы = число рёбер на неё; тема без рассказов → 0", () => {
    const g = buildGraph(
      [
        story({ slug: "a", themes: ["soul"] }),
        story({ slug: "b", themes: ["soul"] }),
      ],
      themes,
    );
    expect(themeDegree(g)).toEqual({ soul: 2, light: 0, death: 0 });
  });

  it("пустой граф → {}", () => {
    expect(themeDegree({ nodes: [], links: [] })).toEqual({});
  });

  it("висячий target добавляется ключом (?? 0)", () => {
    const g = buildGraph([story({ slug: "a", themes: ["rebirth"] })], themes);
    expect(themeDegree(g)).toEqual({ soul: 0, light: 0, death: 0, rebirth: 1 });
  });
});

describe("reweight", () => {
  const weightOf = (g: WheelGraph, s: string, t: string) =>
    g.links.find((l) => l.source === s && l.target === t)!.weight;

  it("усиливает рёбра активного рассказа и рёбра его тем (соседей)", () => {
    const g = buildGraph(
      [
        story({ slug: "a", themes: ["soul", "light"] }),
        story({ slug: "b", themes: ["soul"] }),
        story({ slug: "c", themes: ["death"] }),
      ],
      themes,
    );
    const r = reweight(g, "a", 4);
    expect(weightOf(r, "a", "soul")).toBe(4);
    expect(weightOf(r, "a", "light")).toBe(4);
    expect(weightOf(r, "b", "soul")).toBe(4);
    expect(weightOf(r, "c", "death")).toBe(1);
  });

  it("по умолчанию boost = 4", () => {
    const g = buildGraph([story({ slug: "a", themes: ["soul"] })], themes);
    expect(reweight(g, "a").links[0].weight).toBe(4);
  });

  it("activeSlug отсутствует → веса не меняются", () => {
    const g = buildGraph([story({ slug: "a", themes: ["soul"] })], themes);
    expect(reweight(g, "нет").links[0].weight).toBe(1);
  });

  it("boost = 0 → веса обнуляются", () => {
    const g = buildGraph([story({ slug: "a", themes: ["soul"] })], themes);
    expect(reweight(g, "a", 0).links[0].weight).toBe(0);
  });

  it("массив nodes возвращается по ссылке", () => {
    const g = buildGraph([story({ slug: "a", themes: ["soul"] })], themes);
    expect(reweight(g, "a").nodes).toBe(g.nodes);
  });

  it("применяется многократно (компаундится)", () => {
    const g = buildGraph([story({ slug: "a", themes: ["soul"] })], themes);
    const twice = reweight(reweight(g, "a", 2), "a", 2);
    expect(twice.links[0].weight).toBe(4);
  });
});

describe("reweightRead", () => {
  it("пустое множество → тот же объект графа (===)", () => {
    const g = buildGraph([story({ slug: "a", themes: ["soul"] })], themes);
    expect(reweightRead(g, new Set())).toBe(g);
  });

  it("для прочитанных source: weight·boost и distanceScale·pull", () => {
    const g = buildGraph(
      [
        story({ slug: "a", themes: ["soul"] }),
        story({ slug: "b", themes: ["soul"] }),
      ],
      themes,
    );
    const r = reweightRead(g, new Set(["a"]), 1.6, 0.62);
    const la = r.links.find((l) => l.source === "a")!;
    const lb = r.links.find((l) => l.source === "b")!;
    expect(la.weight).toBeCloseTo(1.6);
    expect(la.distanceScale).toBeCloseTo(0.62);
    expect(lb.weight).toBe(1);
    expect(lb.distanceScale).toBeUndefined();
  });

  it("distanceScale по умолчанию 1 перед масштабированием", () => {
    const g = buildGraph([story({ slug: "a", themes: ["soul"] })], themes);
    expect(reweightRead(g, new Set(["a"]), 2, 0.5).links[0].distanceScale).toBeCloseTo(0.5);
  });

  it("значения по умолчанию boost=1.6, pull=0.62", () => {
    const g = buildGraph([story({ slug: "a", themes: ["soul"] })], themes);
    const r = reweightRead(g, new Set(["a"]));
    expect(r.links[0].weight).toBeCloseTo(1.6);
    expect(r.links[0].distanceScale).toBeCloseTo(0.62);
  });

  it("не трогает рёбра соседей по теме (только source)", () => {
    const g = buildGraph(
      [
        story({ slug: "a", themes: ["soul"] }),
        story({ slug: "b", themes: ["soul"] }),
      ],
      themes,
    );
    const r = reweightRead(g, new Set(["a"]));
    expect(r.links.find((l) => l.source === "b")!.weight).toBe(1);
  });

  it("nodes по ссылке при непустом множестве", () => {
    const g = buildGraph([story({ slug: "a", themes: ["soul"] })], themes);
    expect(reweightRead(g, new Set(["a"])).nodes).toBe(g.nodes);
  });
});

describe("readFractionByTheme", () => {
  it("доля прочитанных рассказов на теме", () => {
    const g = buildGraph(
      [
        story({ slug: "a", themes: ["soul"] }),
        story({ slug: "b", themes: ["soul"] }),
        story({ slug: "c", themes: ["light"] }),
      ],
      themes,
    );
    const f = readFractionByTheme(g, new Set(["a"]));
    expect(f.soul).toBeCloseTo(0.5);
    expect(f.light).toBe(0);
    expect(f.death).toBe(0);
  });

  it("все прочитаны → 1", () => {
    const g = buildGraph([story({ slug: "a", themes: ["soul"] })], themes);
    expect(readFractionByTheme(g, new Set(["a"])).soul).toBe(1);
  });

  it("пустое множество → все 0 (деление на ноль защищено)", () => {
    const g = buildGraph([story({ slug: "a", themes: ["soul"] })], themes);
    expect(readFractionByTheme(g, new Set())).toEqual({ soul: 0, light: 0, death: 0 });
  });

  it("висячий target создаёт лишний ключ", () => {
    const g = buildGraph([story({ slug: "a", themes: ["rebirth"] })], themes);
    expect(readFractionByTheme(g, new Set(["a"])).rebirth).toBe(1);
  });
});
