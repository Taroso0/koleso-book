import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { workshopEntrySchema, type WorkshopEntry } from "@/content/schema";
import type { Illustration } from "@/lib/illustrations";

// ─────────────────────────────────────────────────────────────────────────────
//  «Мастерская» (§9/§11-A3) — building-in-public 3-й книги. Контент ФАЙЛОВЫЙ
//  (content/workshop/*.md), отдельно от канона (рассказы/книги в lib/content.ts).
//
//  ШОВ ПОД CMS: это единственный модуль, читающий записи «Мастерской». Чтобы
//  отдать раздел в Payload/Sanity (§11-A3, «только при реальной потребности»),
//  достаточно переписать тело getWorkshopEntries()/getWorkshopEntry() на запрос к
//  CMS — страницы, компоненты и файловый канон при этом НЕ трогаются.
// ─────────────────────────────────────────────────────────────────────────────

const WORKSHOP_DIR = path.join(process.cwd(), "content", "workshop");

/** Понятное сообщение об ошибке валидации: поле → причина (как в lib/content.ts). */
function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `  • ${i.path.join(".") || "(корень)"}: ${i.message}`)
    .join("\n");
}

/** Все опубликованные записи «Мастерской», свежие сверху (по date ↓, затем slug).
 *  Валидация zod на сборке: невалидный frontmatter ломает сборку с указанием файла и поля. */
export function getWorkshopEntries(): WorkshopEntry[] {
  if (!fs.existsSync(WORKSHOP_DIR)) return [];
  const entries = fs
    .readdirSync(WORKSHOP_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(WORKSHOP_DIR, file), "utf-8");
      const { data, content } = matter(raw);
      const parsed = workshopEntrySchema.safeParse(data);
      if (!parsed.success) {
        throw new Error(
          `Невалидный frontmatter в content/workshop/${file}:\n${formatIssues(parsed.error)}`,
        );
      }
      return { ...parsed.data, body: content } satisfies WorkshopEntry;
    })
    .filter((e) => e.published);

  return entries.sort(
    (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug),
  );
}

export function getWorkshopEntry(slug: string): WorkshopEntry | undefined {
  return getWorkshopEntries().find((e) => e.slug === slug);
}

/** Плашка записи для переиспользуемого <IllustrationPlate /> (или null).
 *  Размеры берутся из frontmatter — схема гарантирует их наличие при заданном image. */
export function getWorkshopIllustration(entry: WorkshopEntry): Illustration | null {
  if (!entry.image || !entry.imageWidth || !entry.imageHeight) return null;
  return {
    src: entry.image,
    width: entry.imageWidth,
    height: entry.imageHeight,
    alt: entry.imageAlt ?? `Иллюстрация к записи «${entry.title}»`,
  };
}
