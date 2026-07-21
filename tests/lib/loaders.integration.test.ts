import { describe, it, expect } from "vitest";
import {
  getAllStories,
  getBooks,
  getStory,
  getStoriesByBook,
} from "@/lib/content";
import {
  getWorkshopEntries,
  getWorkshopEntry,
  getWorkshopIllustration,
} from "@/lib/workshop";
import type { WorkshopEntry } from "@/content/schema";

// Интеграция против реального стабильного content/ (34 рассказа, 2 книги, демо-Мастерская).
// Проверяем контракт загрузки на живых данных — без моков.

describe("getAllStories (реальный content/)", () => {
  const stories = getAllStories();

  it("корпус совпадает с оглавлениями книг — ни одного лишнего или потерянного", () => {
    // Было `>= 30`: потеря четырёх рассказов проходила зелёной. Сверяем с суммой
    // book.stories[] — это ещё и проверка, что .mdx не осиротел мимо оглавления.
    const expected = getBooks().reduce((n, b) => n + b.stories.length, 0);
    expect(stories.length).toBe(expected);
  });

  it("отсортированы по order по возрастанию", () => {
    const orders = stories.map((s) => s.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("у каждого рассказа есть тело и обязательные поля", () => {
    for (const s of stories) {
      expect(typeof s.body).toBe("string");
      expect(s.slug).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(["kolizey", "koleso", "kniga3"]).toContain(s.book);
    }
  });
});

describe("getBooks (реальный content/)", () => {
  it("возвращает изданные книги", () => {
    const ids = getBooks().map((b) => b.id);
    expect(ids).toContain("kolizey");
    expect(ids).toContain("koleso");
  });
});

describe("getStory / getStoriesByBook", () => {
  it("getStory находит по slug", () => {
    const first = getAllStories()[0];
    expect(getStory(first.slug)?.slug).toBe(first.slug);
  });

  it("getStory: неизвестный slug → undefined", () => {
    expect(getStory("нет-такого-рассказа")).toBeUndefined();
  });

  it("getStoriesByBook фильтрует по книге", () => {
    const kolizey = getStoriesByBook("kolizey");
    expect(kolizey.length).toBeGreaterThan(0);
    expect(kolizey.every((s) => s.book === "kolizey")).toBe(true);
  });

  it("getStoriesByBook: несуществующая книга → []", () => {
    expect(getStoriesByBook("нет")).toEqual([]);
  });
});

// На сборке загрузчики мемоизированы (lib/buildCache.ts), поэтому список рассказов
// живёт в кэше. Вызывающие сортируют его на месте (`getAllStories().sort(…)` на хабе,
// `getBooks().sort(…)` в «Читальне» и BookSwitcher), а Array.sort мутирует — значит
// каждый вызов обязан отдавать свежий массив, иначе кэш переупорядочится под всеми.
describe("загрузчики отдают копию (защита кэша от сортировки на месте)", () => {
  it("getAllStories: каждый вызов — новый массив", () => {
    expect(getAllStories()).not.toBe(getAllStories());
  });

  it("getBooks: каждый вызов — новый массив", () => {
    expect(getBooks()).not.toBe(getBooks());
  });

  it("getWorkshopEntries: каждый вызов — новый массив", () => {
    expect(getWorkshopEntries()).not.toBe(getWorkshopEntries());
  });

  it("сортировка результата не меняет порядок следующего вызова", () => {
    const before = getAllStories().map((s) => s.slug);
    getAllStories().sort((a, b) => b.slug.localeCompare(a.slug));
    expect(getAllStories().map((s) => s.slug)).toEqual(before);
  });
});

describe("getWorkshopEntries / getWorkshopEntry (реальный content/)", () => {
  const entries = getWorkshopEntries();

  it("загружает только опубликованные записи", () => {
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((e) => e.published)).toBe(true);
  });

  it("отсортированы по date по убыванию", () => {
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].date.localeCompare(entries[i - 1].date)).toBeLessThanOrEqual(0);
    }
  });

  it("getWorkshopEntry находит по slug", () => {
    expect(getWorkshopEntry(entries[0].slug)?.slug).toBe(entries[0].slug);
  });

  it("getWorkshopEntry: неизвестный slug → undefined", () => {
    expect(getWorkshopEntry("нет")).toBeUndefined();
  });
});

describe("getWorkshopIllustration (чистая функция)", () => {
  const base: WorkshopEntry = {
    slug: "x",
    title: "Запись",
    kind: "note",
    date: "2026-01-01",
    themes: [],
    published: true,
    body: "",
  };

  it("нет image → null", () => {
    expect(getWorkshopIllustration(base)).toBeNull();
  });

  it("image без ширины → null", () => {
    expect(getWorkshopIllustration({ ...base, image: "/w.webp", imageHeight: 600 })).toBeNull();
  });

  it("image без высоты → null", () => {
    expect(getWorkshopIllustration({ ...base, image: "/w.webp", imageWidth: 800 })).toBeNull();
  });

  it("image + размеры → плашка, alt по умолчанию из заголовка", () => {
    expect(
      getWorkshopIllustration({ ...base, image: "/w.webp", imageWidth: 800, imageHeight: 600 }),
    ).toEqual({
      src: "/w.webp",
      width: 800,
      height: 600,
      alt: "Иллюстрация к записи «Запись»",
    });
  });

  it("imageAlt переопределяет alt", () => {
    expect(
      getWorkshopIllustration({
        ...base,
        image: "/w.webp",
        imageWidth: 800,
        imageHeight: 600,
        imageAlt: "Своя подпись",
      })?.alt,
    ).toBe("Своя подпись");
  });
});
