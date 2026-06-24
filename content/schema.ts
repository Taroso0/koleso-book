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
