import { notFound } from "next/navigation";
import {
  getAllStories,
  getStory,
  getStoriesByBook,
  getBooks,
} from "@/lib/content";
import { Reader } from "@/components/reader/Reader";

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
  const { book, story } = await params;
  const s = getStory(story);
  if (!s) return { title: "Читальня" };
  const description =
    s.firstLine.length > 157 ? s.firstLine.slice(0, 157).trimEnd() + "…" : s.firstLine;
  const url = `/read/${book}/${story}`;
  return {
    title: `${s.title} — Читальня`,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", title: s.title, description, url },
    twitter: { card: "summary_large_image", title: s.title, description },
  };
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
  if (!bookMeta) notFound();

  const inBook = getStoriesByBook(book); // отсортированы по order
  const idx = inBook.findIndex((s) => s.slug === current.slug);
  const prev = inBook[idx - 1];
  const next = inBook[idx + 1];

  return (
    <Reader
      book={bookMeta}
      story={current}
      prev={prev && { slug: prev.slug, title: prev.title }}
      next={next && { slug: next.slug, title: next.title }}
    />
  );
}
