import { describe, it, expect } from "vitest";
import { getIllustration } from "@/lib/illustrations";
import manifest from "@/content/illustrations.json";
import type { Story, Book, BookId } from "@/content/schema";

const dims = manifest as Record<string, { width: number; height: number }>;
const firstKey = Object.keys(dims)[0]; // напр. "kolizey/01-odnazhdy-utrom"

/** Story с иллюстрацией по ключу манифеста book/slug. */
function storyFrom(key: string, over: Partial<Story> = {}): Story {
  const [book, slug] = key.split("/");
  return {
    slug,
    title: "Заголовок",
    book: book as BookId,
    order: 1,
    firstLine: "Строка.",
    themes: [],
    body: "",
    illustration: `/illustrations/${key}.webp`,
    ...over,
  };
}

describe("getIllustration", () => {
  it("нет illustration → null", () => {
    expect(getIllustration({ ...storyFrom(firstKey), illustration: undefined })).toBeNull();
  });

  it("реальный ключ → src и размеры из манифеста", () => {
    const s = storyFrom(firstKey);
    expect(getIllustration(s)).toEqual({
      src: s.illustration,
      width: dims[firstKey].width,
      height: dims[firstKey].height,
      alt: `Иллюстрация к рассказу «${s.title}»`,
      artist: undefined,
    });
  });

  it("artist берётся из book", () => {
    const [id] = firstKey.split("/") as [BookId];
    const book: Book = { id, title: "Кн", year: 2022, stories: [], artist: "Художник" };
    expect(getIllustration(storyFrom(firstKey), book)?.artist).toBe("Художник");
  });

  it("book не передан → artist undefined", () => {
    expect(getIllustration(storyFrom(firstKey))?.artist).toBeUndefined();
  });

  it("illustration задан, но ключа нет в манифесте → бросает", () => {
    expect(() => getIllustration(storyFrom(firstKey, { slug: "___нет-в-манифесте___" }))).toThrow(
      /Нет размеров иллюстрации/,
    );
  });
});
