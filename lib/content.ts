import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { memoInBuild } from "@/lib/buildCache";
import {
  storyFrontmatterSchema,
  bookSchema,
  type Story,
  type Book,
} from "@/content/schema";

const STORIES_DIR = path.join(process.cwd(), "content", "stories");
const BOOKS_DIR = path.join(process.cwd(), "content", "books");

/** Понятное сообщение об ошибке валидации: поле -> причина. */
function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `  • ${i.path.join(".") || "(корень)"}: ${i.message}`)
    .join("\n");
}

function readStories(): Story[] {
  if (!fs.existsSync(STORIES_DIR)) return [];
  const stories = fs
    .readdirSync(STORIES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(STORIES_DIR, file), "utf-8");
      const { data, content } = matter(raw);
      const parsed = storyFrontmatterSchema.safeParse(data);
      if (!parsed.success) {
        throw new Error(
          `Невалидный frontmatter в content/stories/${file}:\n${formatIssues(parsed.error)}`,
        );
      }
      return { ...parsed.data, body: content } satisfies Story;
    });
  return stories.sort((a, b) => a.order - b.order);
}

function readBooks(): Book[] {
  if (!fs.existsSync(BOOKS_DIR)) return [];
  return fs
    .readdirSync(BOOKS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(BOOKS_DIR, file), "utf-8");
      const parsed = bookSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        throw new Error(
          `Невалидные метаданные книги content/books/${file}:\n${formatIssues(parsed.error)}`,
        );
      }
      return parsed.data;
    });
}

// Диск читается один раз за сборку (в dev и тестах кэш выключен — см. buildCache).
const storiesOnce = memoInBuild(readStories);
const booksOnce = memoInBuild(readBooks);
const storyBySlug = memoInBuild(
  () => new Map(storiesOnce().map((s) => [s.slug, s])),
);

/** Все рассказы из content/stories/*.mdx, отсортированы по order.
 *  Валидация zod на сборке: невалидный frontmatter ломает сборку с указанием файла и поля.
 *  Отдаём копию: вызывающие сортируют результат на месте (Array.sort мутирует),
 *  а кэш должен пережить это неизменным. */
export function getAllStories(): Story[] {
  return storiesOnce().slice();
}

/** Метаданные книг из content/books/*.json (валидируются zod). Тоже копия — по той же
 *  причине: `getBooks().sort(…)` есть и на хабе, и в «Читальне», и в BookSwitcher. */
export function getBooks(): Book[] {
  return booksOnce().slice();
}

export function getStory(slug: string): Story | undefined {
  return storyBySlug().get(slug);
}

export function getStoriesByBook(book: string): Story[] {
  return storiesOnce().filter((s) => s.book === book);
}
