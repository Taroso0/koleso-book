import { z } from "zod";

/** 10 понятий «Колеса» (id ↔ метка в content/themes.ts). Концепция §8 / §4. */
export const THEME_IDS = [
  "soul", "light", "time", "memory", "death",
  "choice", "illusion", "fate", "human", "rebirth",
] as const;
export const themeIdSchema = z.enum(THEME_IDS);
export type ThemeId = z.infer<typeof themeIdSchema>;

/** Книги: 2 изданные + 3-я в работе. */
export const BOOK_IDS = ["kolizey", "koleso", "kniga3"] as const;
export const bookIdSchema = z.enum(BOOK_IDS);
export type BookId = z.infer<typeof bookIdSchema>;

/** Frontmatter рассказа — единый источник правды для Читальни и Колеса (§4). */
export const storyFrontmatterSchema = z.object({
  slug: z.string().min(1), // стабильный, для дип-линков из «Колеса»
  title: z.string().min(1),
  book: bookIdSchema,
  order: z.number().int().positive(), // позиция в книге
  themes: z.array(themeIdSchema).default([]), // связи с понятиями (заполняет человек)
  firstLine: z.string().min(1), // «первая строка как событие»
  illustration: z.string().min(1).optional(), // путь к плашке
});
export type StoryFrontmatter = z.infer<typeof storyFrontmatterSchema>;

/** Рассказ = frontmatter + тело (MDX). */
export type Story = StoryFrontmatter & { body: string };

export const themeSchema = z.object({
  id: themeIdSchema,
  label: z.string().min(1),
});
export type Theme = z.infer<typeof themeSchema>;

export const bookSchema = z.object({
  id: bookIdSchema,
  title: z.string().min(1),
  year: z.number().int(),
  artist: z.string().min(1).optional(), // иллюстратор книги (для подписи плашек)
  stories: z.array(z.string().min(1)), // slug'и рассказов по порядку
});
export type Book = z.infer<typeof bookSchema>;

/** Виды записей «Мастерской» (building-in-public для 3-й книги, §9/§11-A3). */
export const WORKSHOP_KINDS = ["fragment", "draft", "note", "illustration"] as const;
export const workshopKindSchema = z.enum(WORKSHOP_KINDS);
export type WorkshopKind = z.infer<typeof workshopKindSchema>;

/** Запись «Мастерской» — НЕ канон (рассказы/книги), а отдельный файловый поток.
 *  Загрузка изолирована в lib/workshop.ts (единственный «шов» под будущую CMS).
 *  Картинки — в frontmatter (src + размеры для next/image), а не в illustrations.json
 *  (тот — канон из PDF, ключ book/slug). */
export const workshopEntrySchema = z.object({
  slug: z.string().min(1), // стабильный, для дип-линков /workshop/[slug]
  title: z.string().min(1),
  kind: workshopKindSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ожидается дата YYYY-MM-DD"), // хронология ленты
  summary: z.string().min(1).optional(), // краткий тизер для карточки индекса
  themes: z.array(themeIdSchema).default([]), // опц. связь с понятиями «Колеса»
  image: z.string().min(1).optional(), // путь к иллюстрации (public/workshop/…)
  imageWidth: z.number().int().positive().optional(), // нужен next/image (без CLS)
  imageHeight: z.number().int().positive().optional(),
  imageAlt: z.string().min(1).optional(),
  published: z.boolean().default(true), // false — скрыть запись из ленты
}).superRefine((data, ctx) => {
  // Есть картинка → обязательны размеры и alt (next/image без CLS + доступность, §10).
  if (data.image) {
    for (const field of ["imageWidth", "imageHeight", "imageAlt"] as const) {
      if (data[field] == null) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `обязателен, если задан image`,
        });
      }
    }
  }
});
export type WorkshopFrontmatter = z.infer<typeof workshopEntrySchema>;

/** Запись = frontmatter + тело (проза, рендерится тем же ProseBody). */
export type WorkshopEntry = WorkshopFrontmatter & { body: string };
