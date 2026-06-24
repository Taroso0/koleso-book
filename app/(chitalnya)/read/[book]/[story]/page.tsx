import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllStories,
  getStory,
  getStoriesByBook,
  getBooks,
} from "@/lib/content";
import { applyTypograf } from "@/lib/typograf";

// Полная SSG: параметры всех 34 рассказов известны на сборке.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllStories().map((s) => ({ book: s.book, story: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ book: string; story: string }>;
}) {
  const { story } = await params;
  const s = getStory(story);
  return { title: s ? `${s.title} — Читальня` : "Читальня" };
}

// Курсив *…* только с markdown-подобными границами: открывающая «*» — в начале
// или после пробела/скобки/кавычки, закрывающая — в конце или перед пробелом/пунктуацией.
// Так непарные звёздочки (маркеры сносок «Айон*», самоцензура «Бл*») остаются литералом
// и не «сдвигают» курсив на соседний фрагмент. Сноски как фича — Шаг 2.2.
const EMPHASIS = /(?<=^|[\s(«„])\*(\S(?:[^*\n]*\S)?)\*(?=$|[\s.,!?:;)»"…—-])/gu;

/** Инлайн-рендер курсива (best-effort; финальная вычитка — за человеком). */
function renderInline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(EMPHASIS)) {
    const start = m.index;
    if (start > last) nodes.push(text.slice(last, start));
    nodes.push(<em key={key++}>{m[1]}</em>);
    last = start + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ book: string; story: string }>;
}) {
  const { book, story } = await params;
  const current = getStory(story);
  if (!current || current.book !== book) notFound();

  const bookMeta = getBooks().find((b) => b.id === book);
  const inBook = getStoriesByBook(book); // отсортированы по order
  const idx = inBook.findIndex((s) => s.slug === current.slug);
  const prev = inBook[idx - 1];
  const next = inBook[idx + 1];

  // Тело — простые абзацы, разделённые пустой строкой; «***» — разделитель сцен.
  const blocks = current.body
    .trim()
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <main className="mx-auto max-w-[42rem] px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <Link href="/read" className="hover:text-foreground">
          Читальня
        </Link>
        {bookMeta && (
          <>
            {" · "}
            <Link href={`/read/${book}`} className="hover:text-foreground">
              {bookMeta.title}
            </Link>
          </>
        )}
      </p>

      <article className="mt-6">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-balance">
          {current.title}
        </h1>
        <div className="mt-10 space-y-6 font-serif text-lg leading-prose">
          {blocks.map((block, i) =>
            block === "***" ? (
              <p
                key={i}
                aria-hidden
                className="select-none py-2 text-center text-2xl text-muted-foreground"
              >
                * * *
              </p>
            ) : (
              <p key={i}>{renderInline(applyTypograf(block))}</p>
            ),
          )}
        </div>
      </article>

      <nav className="mt-16 flex justify-between gap-4 border-t border-border pt-6 font-sans text-sm">
        {prev ? (
          <Link
            href={`/read/${book}/${prev.slug}`}
            className="max-w-[45%] hover:text-sodium"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/read/${book}/${next.slug}`}
            className="max-w-[45%] text-right hover:text-sodium"
          >
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
