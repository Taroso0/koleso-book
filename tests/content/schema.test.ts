import { describe, it, expect } from "vitest";
import {
  THEME_IDS,
  BOOK_IDS,
  storyFrontmatterSchema,
  themeSchema,
  bookSchema,
  workshopEntrySchema,
} from "@/content/schema";

describe("канонические ID", () => {
  it("10 тем в каноническом порядке", () => {
    expect(THEME_IDS).toEqual([
      "soul", "light", "time", "memory", "death",
      "choice", "illusion", "fate", "human", "rebirth",
    ]);
  });

  it("3 книги (2 изданные + 3-я в работе)", () => {
    expect(BOOK_IDS).toEqual(["kolizey", "koleso", "kniga3"]);
  });
});

const validStory = {
  slug: "01-x",
  title: "Заголовок",
  book: "kolizey",
  order: 1,
  firstLine: "Первая строка.",
};

describe("storyFrontmatterSchema", () => {
  it("минимальный валидный объект: themes по умолчанию []", () => {
    const r = storyFrontmatterSchema.safeParse(validStory);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.themes).toEqual([]);
  });

  it("полный валидный объект с темами и иллюстрацией", () => {
    expect(
      storyFrontmatterSchema.safeParse({
        ...validStory,
        themes: ["light", "soul"],
        illustration: "/illustrations/kolizey/01-x.webp",
      }).success,
    ).toBe(true);
  });

  it("kniga3 — валидный book-id", () => {
    expect(storyFrontmatterSchema.safeParse({ ...validStory, book: "kniga3" }).success).toBe(true);
  });

  it.each([
    { case: "slug пустой", input: { ...validStory, slug: "" } },
    { case: "title пустой", input: { ...validStory, title: "" } },
    { case: "firstLine пустой", input: { ...validStory, firstLine: "" } },
    { case: "book неизвестный", input: { ...validStory, book: "foo" } },
    { case: "order = 0", input: { ...validStory, order: 0 } },
    { case: "order отрицательный", input: { ...validStory, order: -1 } },
    { case: "order дробный", input: { ...validStory, order: 1.5 } },
    { case: "order строкой (без coercion)", input: { ...validStory, order: "1" } },
    { case: "themes с неизвестной темой", input: { ...validStory, themes: ["foo"] } },
    { case: "illustration пустая строка", input: { ...validStory, illustration: "" } },
  ])("невалидно: $case", ({ input }) => {
    expect(storyFrontmatterSchema.safeParse(input).success).toBe(false);
  });

  it("лишние ключи молча отбрасываются (strip)", () => {
    const r = storyFrontmatterSchema.safeParse({ ...validStory, extra: "x" });
    expect(r.success).toBe(true);
    if (r.success) expect("extra" in r.data).toBe(false);
  });
});

describe("themeSchema", () => {
  it("валидная тема", () => {
    expect(themeSchema.safeParse({ id: "soul", label: "Душа" }).success).toBe(true);
  });

  it.each([
    { case: "пустой label", input: { id: "soul", label: "" } },
    { case: "неизвестный id", input: { id: "foo", label: "X" } },
  ])("невалидно: $case", ({ input }) => {
    expect(themeSchema.safeParse(input).success).toBe(false);
  });
});

const validBook = { id: "kolizey", title: "Колизей", year: 2022, stories: ["01-x"] };

describe("bookSchema", () => {
  it("валидная книга (artist опционален и может отсутствовать)", () => {
    expect(bookSchema.safeParse(validBook).success).toBe(true);
  });

  it("year без .positive(): 0 и отрицательный валидны", () => {
    expect(bookSchema.safeParse({ ...validBook, year: 0 }).success).toBe(true);
    expect(bookSchema.safeParse({ ...validBook, year: -100 }).success).toBe(true);
  });

  it("stories: [] валидно (нет min на массиве)", () => {
    expect(bookSchema.safeParse({ ...validBook, stories: [] }).success).toBe(true);
  });

  it.each([
    { case: "year дробный", input: { ...validBook, year: 2022.5 } },
    { case: "year строкой", input: { ...validBook, year: "2022" } },
    { case: "artist пустая строка", input: { ...validBook, artist: "" } },
    { case: "stories отсутствует (нет default)", input: { id: "kolizey", title: "Колизей", year: 2022 } },
    { case: "элемент stories пустой", input: { ...validBook, stories: [""] } },
    { case: "id неизвестный", input: { ...validBook, id: "foo" } },
  ])("невалидно: $case", ({ input }) => {
    expect(bookSchema.safeParse(input).success).toBe(false);
  });
});

const validEntry = { slug: "x", title: "T", kind: "note", date: "2026-07-15" };

describe("workshopEntrySchema", () => {
  it("минимальный валидный: published=true, themes=[] по умолчанию", () => {
    const r = workshopEntrySchema.safeParse(validEntry);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.published).toBe(true);
      expect(r.data.themes).toEqual([]);
    }
  });

  it("published: false парсится успешно (фильтруется позже, в loader'е)", () => {
    const r = workshopEntrySchema.safeParse({ ...validEntry, published: false });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.published).toBe(false);
  });

  it("date-регекс проверяет формат, но не календарь: 2026-13-99 проходит", () => {
    expect(workshopEntrySchema.safeParse({ ...validEntry, date: "2026-13-99" }).success).toBe(true);
  });

  it.each([
    { case: "kind неизвестный", input: { ...validEntry, kind: "foo" } },
    { case: "date в один разряд", input: { ...validEntry, date: "2026-6-22" } },
    { case: "date без дефисов", input: { ...validEntry, date: "20260622" } },
    {
      case: "imageWidth = 0 (падает на .positive() раньше superRefine)",
      input: { ...validEntry, image: "/x.webp", imageWidth: 0, imageHeight: 1, imageAlt: "a" },
    },
  ])("невалидно: $case", ({ input }) => {
    expect(workshopEntrySchema.safeParse(input).success).toBe(false);
  });

  it("image без размеров/alt → issue на каждое из imageWidth/imageHeight/imageAlt", () => {
    const r = workshopEntrySchema.safeParse({ ...validEntry, image: "/x.webp" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join("."));
      expect(paths).toEqual(expect.arrayContaining(["imageWidth", "imageHeight", "imageAlt"]));
    }
  });

  it("image + только imageWidth → issue на imageHeight и imageAlt, но не imageWidth", () => {
    const r = workshopEntrySchema.safeParse({ ...validEntry, image: "/x.webp", imageWidth: 800 });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join("."));
      expect(paths).toEqual(expect.arrayContaining(["imageHeight", "imageAlt"]));
      expect(paths).not.toContain("imageWidth");
    }
  });

  it("image + все размеры и alt → валидно", () => {
    expect(
      workshopEntrySchema.safeParse({
        ...validEntry,
        image: "/x.webp",
        imageWidth: 800,
        imageHeight: 600,
        imageAlt: "Подпись",
      }).success,
    ).toBe(true);
  });

  it("нет image, но задан imageWidth → валидно (superRefine не срабатывает)", () => {
    expect(workshopEntrySchema.safeParse({ ...validEntry, imageWidth: 800 }).success).toBe(true);
  });
});
