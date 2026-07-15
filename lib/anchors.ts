import manifest from "@/content/illustrations.json";
import { wheelAnchors, type WheelAnchor } from "@/content/anchors";
import type { ThemeId } from "@/content/schema";

/** Размеры плашки нужны next/image (резерв места → CLS = 0, §10). Источник —
 *  content/illustrations.json (генерится scripts/illustrations_manifest.py), ключ koleso/<slug>. */
type Dimensions = { width: number; height: number };
const dimensions = manifest as Record<string, Dimensions>;

export type ResolvedAnchor = {
  theme: ThemeId;
  src: string;
  width: number;
  height: number;
  nudge?: WheelAnchor["nudge"];
};

/** Якоря «Колеса», разрешённые в пути + размеры. Нет размеров в манифесте → запись
 *  молча отбрасывается: плашка не рендерится, граф цел (штатная деградация — их всего
 *  2–3 из 10 тем). Вычисляется один раз при загрузке модуля (данные статичны). */
export const resolvedWheelAnchors: ResolvedAnchor[] = wheelAnchors.flatMap((a) => {
  const dim = dimensions[`koleso/${a.slug}`];
  if (!dim) return [];
  return [
    {
      theme: a.theme,
      src: `/illustrations/koleso/${a.slug}.webp`,
      width: dim.width,
      height: dim.height,
      nudge: a.nudge,
    },
  ];
});
