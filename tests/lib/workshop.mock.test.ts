import { describe, it, expect, vi, beforeEach } from "vitest";

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
import { getWorkshopEntries } from "@/lib/workshop";

const mockFs = fs as unknown as {
  existsSync: ReturnType<typeof vi.fn>;
  readdirSync: ReturnType<typeof vi.fn>;
  readFileSync: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.resetAllMocks();
});

function entry(fields: Record<string, unknown>): string {
  const yaml = Object.entries(fields)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n");
  return `---\n${yaml}\n---\nТело записи.`;
}

describe("getWorkshopEntries (мок fs)", () => {
  it("нет каталога → []", () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(getWorkshopEntries()).toEqual([]);
  });

  it("принимает и .md, и .mdx (но не прочие расширения)", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(["a.md", "b.mdx", "c.txt"]);
    mockFs.readFileSync
      .mockReturnValueOnce(entry({ slug: "a", title: "A", kind: "note", date: "2026-01-01" }))
      .mockReturnValueOnce(entry({ slug: "b", title: "B", kind: "note", date: "2026-01-02" }));
    expect(getWorkshopEntries().map((e) => e.slug).sort()).toEqual(["a", "b"]);
    expect(mockFs.readFileSync).toHaveBeenCalledTimes(2);
  });

  it("published: false исключается из ленты", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(["a.md", "hidden.md"]);
    mockFs.readFileSync
      .mockReturnValueOnce(entry({ slug: "a", title: "A", kind: "note", date: "2026-01-01" }))
      .mockReturnValueOnce(
        entry({ slug: "hidden", title: "H", kind: "note", date: "2026-01-05", published: false }),
      );
    expect(getWorkshopEntries().map((e) => e.slug)).toEqual(["a"]);
  });

  it("сортировка: date по убыванию, тай-брейк slug по возрастанию", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(["b.md", "a.md", "z.md"]);
    mockFs.readFileSync
      .mockReturnValueOnce(entry({ slug: "b", title: "B", kind: "note", date: "2026-01-01" }))
      .mockReturnValueOnce(entry({ slug: "a", title: "A", kind: "note", date: "2026-01-01" }))
      .mockReturnValueOnce(entry({ slug: "z", title: "Z", kind: "note", date: "2026-05-05" }));
    expect(getWorkshopEntries().map((e) => e.slug)).toEqual(["z", "a", "b"]);
  });

  it("невалидный frontmatter → бросает с именем файла", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(["bad.md"]);
    mockFs.readFileSync.mockReturnValue(
      entry({ slug: "bad", title: "B", kind: "note", date: "плохая-дата" }),
    );
    expect(() => getWorkshopEntries()).toThrow(/content\/workshop\/bad\.md/);
  });
});
