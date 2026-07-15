import type { ThemeId } from "./schema";

/** Декоративный слой «Колеса» (§8, §14): тема → якорь-иллюстрация. Держим ОТДЕЛЬНО
 *  от content/themes.ts и schema.ts — канон-схема темы остаётся {id,label}, декор не
 *  подмешивается в источник типов контента (якоря — улучшение поверх готовой геометрии).
 *  Порядок = приоритет (при сокращении числа якорей отсекается хвост). slug — имя файла
 *  в public/illustrations/koleso/; размеры берёт lib/anchors.ts из illustrations.json.
 *  Отбор (§8): «Человек» (max-степень, горит в покое), «Смерть», «Иллюзия» — три разные
 *  дуги кольца, якоря не сбиваются в одну сторону. Финальное слово по составу — за автором. */
export type WheelAnchor = {
  theme: ThemeId;
  slug: string;
  story: string; // название рассказа — для читаемости данных (в коде не используется)
  nudge?: { x?: number; y?: number }; // точечная правка позиции, VIEW-единицы (1000×760)
};

export const wheelAnchors: readonly WheelAnchor[] = [
  { theme: "human", slug: "16-nablyudatel", story: "Наблюдатель" },
  { theme: "death", slug: "01-devyat-zhizney", story: "Девять жизней" },
  { theme: "illusion", slug: "08-fake-it", story: "Fake It" },
];
