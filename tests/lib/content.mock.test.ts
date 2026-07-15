import { describe, it, expect, vi, beforeEach } from "vitest";

// Мок node:fs, чтобы проверить крайние случаи загрузчика без файлов на диске.
// gray-matter и zod оставляем настоящими — валидируем реальный парсинг.
vi.mock("node:fs", () => {
  const existsSync = vi.fn();
  const readdirSync = vi.fn();
  const readFileSync = vi.fn();
  return {
    default: { existsSync, readdirSync, readFileSync },
    existsSync,
    readdirSync,
    readFileSync,
  };
});

import fs from "node:fs";
import { getAllStories, getBooks } from "@/lib/content";

const mockFs = fs as unknown as {
  existsSync: ReturnType<typeof vi.fn>;
  readdirSync: ReturnType<typeof vi.fn>;
  readFileSync: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.resetAllMocks();
});

/** Собрать MDX-строку с frontmatter из полей. */
function mdx(fields: Record<string, unknown>): string {
  const yaml = Object.entries(fields)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n");
  return `---\n${yaml}\n---\nТело рассказа.`;
}

describe("getAllStories (мок fs)", () => {
  it("нет каталога → []", () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(getAllStories()).toEqual([]);
  });

  it("файлы не-.mdx отфильтровываются", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(["a.mdx", "readme.txt", "b.json"]);
    mockFs.readFileSync.mockReturnValue(
      mdx({ slug: "a", title: "A", book: "kolizey", order: 1, firstLine: "Строка." }),
    );
    expect(getAllStories()).toHaveLength(1);
    expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);
  });

  it("сортирует по order по возрастанию", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(["c.mdx", "a.mdx"]);
    mockFs.readFileSync
      .mockReturnValueOnce(mdx({ slug: "c", title: "C", book: "kolizey", order: 3, firstLine: "Строка." }))
      .mockReturnValueOnce(mdx({ slug: "a", title: "A", book: "kolizey", order: 1, firstLine: "Строка." }));
    expect(getAllStories().map((s) => s.order)).toEqual([1, 3]);
  });

  it("тело рассказа берётся из содержимого после frontmatter", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(["a.mdx"]);
    mockFs.readFileSync.mockReturnValue(
      mdx({ slug: "a", title: "A", book: "kolizey", order: 1, firstLine: "Строка." }),
    );
    expect(getAllStories()[0].body.trim()).toBe("Тело рассказа.");
  });

  it("невалидный frontmatter → бросает с именем файла и полем", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(["bad.mdx"]);
    mockFs.readFileSync.mockReturnValue(
      mdx({ slug: "bad", title: "B", book: "kolizey", order: -1, firstLine: "Строка." }),
    );
    expect(() => getAllStories()).toThrow(/content\/stories\/bad\.mdx/);
    expect(() => getAllStories()).toThrow(/order/);
  });
});

describe("getBooks (мок fs)", () => {
  it("нет каталога → []", () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(getBooks()).toEqual([]);
  });

  it("читает только .json и валидирует", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(["kolizey.json", "notes.md"]);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ id: "kolizey", title: "Колизей", year: 2022, stories: ["01-x"] }),
    );
    const books = getBooks();
    expect(books).toHaveLength(1);
    expect(books[0].id).toBe("kolizey");
  });

  it("невалидные метаданные → бросает с именем файла", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(["broken.json"]);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ id: "kolizey", title: "", year: 2022, stories: [] }),
    );
    expect(() => getBooks()).toThrow(/content\/books\/broken\.json/);
  });

  it("битый JSON → SyntaxError (не обёрнут дружелюбным сообщением)", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(["bad.json"]);
    mockFs.readFileSync.mockReturnValue("{ не json ");
    expect(() => getBooks()).toThrow(SyntaxError);
  });
});
