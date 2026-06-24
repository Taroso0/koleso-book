import type { Story, Theme, BookId } from "@/content/schema";

// Данные «Колеса» (§5): граф из 10 узлов-понятий + 34 узлов-рассказов; рёбра —
// членство «рассказ ↔ тема». Используется доступным двойником (WheelIndex, Шаг 3.1)
// и визуальным графом d3-force (Шаг 3.2). reweight() при чтении — Шаг 3.3.

export type WheelNode = {
  id: string; // тема: ThemeId; рассказ: slug
  kind: "theme" | "story";
  label: string;
  book?: BookId; // только у рассказов — для дип-линка /read/[book]/[story]
  firstLine?: string; // только у рассказов — превью узла (§8)
};

export type WheelLink = {
  source: string; // slug рассказа
  target: string; // id темы
  weight: number;
};

export type WheelGraph = { nodes: WheelNode[]; links: WheelLink[] };

/** Построить граф «Колеса» из рассказов и тем (§5). */
export function buildGraph(stories: Story[], themes: Theme[]): WheelGraph {
  const nodes: WheelNode[] = [
    ...themes.map((t): WheelNode => ({ id: t.id, kind: "theme", label: t.label })),
    ...stories.map(
      (s): WheelNode => ({
        id: s.slug,
        kind: "story",
        label: s.title,
        book: s.book,
        firstLine: s.firstLine,
      }),
    ),
  ];
  const links: WheelLink[] = stories.flatMap((s) =>
    s.themes.map((themeId) => ({ source: s.slug, target: themeId, weight: 1 })),
  );
  return { nodes, links };
}

export type ThemeWithStories = { theme: WheelNode; stories: WheelNode[] };

/** Группировка для доступного двойника: тема → её рассказы.
 *  Порядок тем — как в graph.nodes (канон из content/themes.ts);
 *  порядок рассказов внутри темы — как во входном массиве stories. */
export function groupByTheme(graph: WheelGraph): ThemeWithStories[] {
  const storyById = new Map(
    graph.nodes.filter((n) => n.kind === "story").map((n) => [n.id, n]),
  );
  return graph.nodes
    .filter((n) => n.kind === "theme")
    .map((theme) => {
      const stories = graph.links
        .filter((l) => l.target === theme.id)
        .map((l) => storyById.get(l.source))
        .filter((n): n is WheelNode => Boolean(n));
      return { theme, stories };
    });
}
