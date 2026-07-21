import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getAllStories, getBooks } from "@/lib/content";
import { themes } from "@/content/themes";
import { THEME_IDS } from "@/content/schema";
import manifest from "@/content/illustrations.json";

// Ссылочная целостность контента.
//
// content/books/*.json пишется руками и не сверяется ни с чем: ни один скрипт
// пайплайна его не трогает. При этом страницы «Читальни» на неизвестный slug делают
// `if (!story) return null` — рассказ молча выпадает из оглавления, сборка проходит
// зелёной. Схема zod проверяет ФОРМУ каждого файла по отдельности и ничего не знает
// о связях между ними. Этот файл закрывает ровно эти связи.

const stories = getAllStories();
const books = getBooks();
const dimensions = manifest as Record<string, { width: number; height: number }>;

describe("slug — идентификатор рассказа", () => {
  it("уникален по всему корпусу", () => {
    // Каталог content/stories/ плоский, и slug НЕ содержит книгу: рассказ №17
    // «Дорога» в третьей книге перезаписал бы 17-doroga.mdx из «Колеса Сансары».
    // Дубль сюда не доедет (файл один), но проверка фиксирует инвариант.
    const seen = new Map<string, number>();
    for (const s of stories) seen.set(s.slug, (seen.get(s.slug) ?? 0) + 1);
    expect([...seen].filter(([, n]) => n > 1)).toEqual([]);
  });

  it("совпадает с именем файла — иначе дип-линк ведёт не туда", () => {
    const files = new Set(
      fs
        .readdirSync(path.join(process.cwd(), "content", "stories"))
        .filter((f) => f.endsWith(".mdx"))
        .map((f) => f.replace(/\.mdx$/, "")),
    );
    expect(stories.filter((s) => !files.has(s.slug)).map((s) => s.slug)).toEqual([]);
  });
});

describe("оглавления книг ↔ файлы рассказов", () => {
  it("каждый slug из books[].stories[] имеет свой .mdx", () => {
    const bySlug = new Set(stories.map((s) => s.slug));
    const missing = books.flatMap((b) =>
      b.stories.filter((slug) => !bySlug.has(slug)).map((slug) => `${b.id}/${slug}`),
    );
    // Такой slug молча исчезает из оглавления: read/[book]/page.tsx → if (!story) return null
    expect(missing).toEqual([]);
  });

  it("каждый .mdx упомянут в оглавлении своей книги", () => {
    const listed = new Map(books.map((b) => [b.id, new Set(b.stories)]));
    const orphans = stories
      .filter((s) => !listed.get(s.book)?.has(s.slug))
      .map((s) => `${s.book}/${s.slug}`);
    // Осиротевший файл продолжает грузиться getAllStories(): попадает в «Колесо» и
    // sitemap, но не в оглавление книги.
    expect(orphans).toEqual([]);
  });

  it("order совпадает с позицией в оглавлении", () => {
    const wrong = books.flatMap((b) =>
      b.stories
        .map((slug, i) => ({ slug, expected: i + 1 }))
        .filter(({ slug, expected }) => {
          const s = stories.find((x) => x.slug === slug);
          return s && s.order !== expected;
        })
        .map(({ slug, expected }) => `${slug}: order ≠ ${expected}`),
    );
    expect(wrong).toEqual([]);
  });

  it("книга ссылается только на свои рассказы", () => {
    const wrong = books.flatMap((b) =>
      b.stories
        .map((slug) => stories.find((s) => s.slug === slug))
        .filter((s) => s && s.book !== b.id)
        .map((s) => `${s!.slug}: book=${s!.book}, но лежит в оглавлении ${b.id}`),
    );
    expect(wrong).toEqual([]);
  });
});

describe("темы «Колеса»", () => {
  it("у каждого канонического id есть метка в content/themes.ts", () => {
    // Пропущенная метка не даёт ни ошибки типов, ни ошибки сборки — тема просто
    // не появится в «Колесе».
    const labelled = new Set(themes.map((t) => t.id));
    expect(THEME_IDS.filter((id) => !labelled.has(id))).toEqual([]);
  });

  it("в content/themes.ts нет лишних и нет дублей", () => {
    expect(themes.length).toBe(THEME_IDS.length);
    expect(new Set(themes.map((t) => t.id)).size).toBe(themes.length);
  });

  it("ни один рассказ не остался без тем", () => {
    // themes по схеме имеет .default([]) — забытая разметка выкидывает рассказ из
    // «Колеса» (нет рёбер), но оставляет его в «Читальне». Ни одной жалобы при этом.
    expect(stories.filter((s) => s.themes.length === 0).map((s) => s.slug)).toEqual([]);
  });

  it("у рассказа нет повторяющихся тем — иначе ребро задваивается", () => {
    const dup = stories
      .filter((s) => new Set(s.themes).size !== s.themes.length)
      .map((s) => s.slug);
    expect(dup).toEqual([]);
  });
});

describe("иллюстрации", () => {
  it("файл по пути illustration существует на диске", () => {
    const missing = stories
      .filter((s) => s.illustration)
      .filter((s) => !fs.existsSync(path.join(process.cwd(), "public", s.illustration!)))
      .map((s) => `${s.slug} → ${s.illustration}`);
    // Ошибочный путь во frontmatter не ломает сборку: размеры резолвятся по ключу
    // book/slug, а картинка просто отдаёт 404 в браузере.
    expect(missing).toEqual([]);
  });

  it("путь illustration согласован с ключом манифеста book/slug", () => {
    const mismatched = stories
      .filter((s) => s.illustration)
      .filter((s) => s.illustration !== `/illustrations/${s.book}/${s.slug}.webp`)
      .map((s) => `${s.slug} → ${s.illustration}`);
    // lib/illustrations.ts берёт размеры по `${book}/${slug}`, НЕ по пути из
    // frontmatter: разъезд этих двух записей даёт правильные размеры у битой картинки.
    expect(mismatched).toEqual([]);
  });

  it("для каждой плашки есть размеры в манифесте", () => {
    const missing = stories
      .filter((s) => s.illustration)
      .filter((s) => !dimensions[`${s.book}/${s.slug}`])
      .map((s) => `${s.book}/${s.slug}`);
    expect(missing).toEqual([]);
  });

  it("в манифесте нет записей без рассказа", () => {
    const known = new Set(stories.map((s) => `${s.book}/${s.slug}`));
    // Мёртвая запись = переименованный рассказ, чья старая плашка осталась в public/.
    expect(Object.keys(dimensions).filter((k) => !known.has(k))).toEqual([]);
  });
});
