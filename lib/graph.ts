import type { Story, Theme, BookId } from "@/content/schema";

// Данные «Колеса» (§5): граф из 10 узлов-понятий + 34 узлов-рассказов; рёбра —
// членство «рассказ ↔ тема». Используется доступным двойником (WheelIndex, Шаг 3.1)
// и визуальным графом d3-force (Шаг 3.2). Перестройка при чтении (Шаг 3.3): временная
// на внимании — reweight(); стойкая на прочитанном — reweightRead() (§8 «память»).

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
  weight: number; // жёсткость пружины (forceLink.strength)
  distanceScale?: number; // длина покоя пружины ×; <1 — рассказ садится ближе к теме
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

/** Степень узла-понятия = число рассказов на теме (§8 «вес понятиям»). Рёбра
 *  направлены story→theme, поэтому степень темы = число рёбер с её target. Все темы
 *  инициализируются нулём — тема без рассказов даёт 0 (достойная деградация). */
export function themeDegree(graph: WheelGraph): Record<string, number> {
  const deg: Record<string, number> = {};
  for (const n of graph.nodes) if (n.kind === "theme") deg[n.id] = 0;
  for (const l of graph.links) deg[l.target] = (deg[l.target] ?? 0) + 1;
  return deg;
}

/** Усилить рёбра активного рассказа и его тем (§5 «↑weight соседних рёбер»).
 *  Чистая; потребитель — перестройка «Колеса» при чтении (Шаг 3.3). */
export function reweight(
  graph: WheelGraph,
  activeSlug: string,
  boost = 4,
): WheelGraph {
  const activeThemes = new Set(
    graph.links.filter((l) => l.source === activeSlug).map((l) => l.target),
  );
  const links = graph.links.map((l) =>
    l.source === activeSlug || activeThemes.has(l.target)
      ? { ...l, weight: l.weight * boost }
      : l,
  );
  return { nodes: graph.nodes, links };
}

/** Стойкая консолидация рёбер ВСЕХ прочитанных рассказов (§8 «память Колеса»).
 *  Отличие от reweight(): работает по множеству и держится постоянно, а не на hover.
 *
 *  Узел двигает `pull` (укорочение длины покоя), а не `boost`: умножить ВСЕ рёбра узла
 *  на общий множитель — значит не сместить точку равновесия, узел лишь держится крепче
 *  там же. Поэтому boost 1.6 и boost 8 дают один и тот же сдвиг.
 *  boost=1.6 → forceLink.strength 0.45·1.6 = 0.72: между базой 0.45 и hover 0.9. Выше 2
 *  брать бессмысленно — упрётся в потолок min(0.9, …) в wheelLayout и сравняется с hover.
 *  Память — фон, живое внимание — акцент. */
export function reweightRead(
  graph: WheelGraph,
  readSlugs: ReadonlySet<string>,
  boost = 1.6,
  pull = 0.62,
): WheelGraph {
  if (readSlugs.size === 0) return graph;
  const links = graph.links.map((l) =>
    readSlugs.has(l.source)
      ? {
          ...l,
          weight: l.weight * boost,
          distanceScale: (l.distanceScale ?? 1) * pull,
        }
      : l,
  );
  return { nodes: graph.nodes, links };
}

/** Доля прочитанных рассказов темы [0..1] — «тепло» темы (дуга прогресса, §8).
 *  Тема без рассказов даёт 0 (как и themeDegree — достойная деградация). */
export function readFractionByTheme(
  graph: WheelGraph,
  readSlugs: ReadonlySet<string>,
): Record<string, number> {
  const total: Record<string, number> = {};
  const done: Record<string, number> = {};
  for (const n of graph.nodes) {
    if (n.kind === "theme") {
      total[n.id] = 0;
      done[n.id] = 0;
    }
  }
  for (const l of graph.links) {
    total[l.target] = (total[l.target] ?? 0) + 1;
    if (readSlugs.has(l.source)) done[l.target] = (done[l.target] ?? 0) + 1;
  }
  const fraction: Record<string, number> = {};
  for (const id of Object.keys(total)) {
    fraction[id] = total[id] ? done[id] / total[id] : 0;
  }
  return fraction;
}
