import manifest from "@/content/illustrations.json";
import type { Story, Book } from "@/content/schema";

/** Размеры плашки нужны next/image, чтобы зарезервировать место и не было CLS (§10).
 *  Источник — content/illustrations.json (генерится scripts/illustrations_manifest.py). */
type Dimensions = { width: number; height: number };
const dimensions = manifest as Record<string, Dimensions>;

export type Illustration = {
  src: string;
  width: number;
  height: number;
  alt: string;
  artist?: string;
};

/** Плашка рассказа (или null, если иллюстрации нет).
 *  Падает на сборке, если у рассказа есть illustration, но нет размеров в манифесте. */
export function getIllustration(story: Story, book?: Book): Illustration | null {
  if (!story.illustration) return null;
  const key = `${story.book}/${story.slug}`;
  const dim = dimensions[key];
  if (!dim) {
    throw new Error(
      `Нет размеров иллюстрации «${key}» в content/illustrations.json — ` +
        `перегенерируйте: python scripts/illustrations_manifest.py`,
    );
  }
  return {
    src: story.illustration,
    width: dim.width,
    height: dim.height,
    alt: `Иллюстрация к рассказу «${story.title}»`,
    artist: book?.artist,
  };
}
