import Link from "next/link";
import { notFound } from "next/navigation";
import { getBooks, getAllStories } from "@/lib/content";

// Полная SSG: все книги известны на сборке, неизвестный slug → 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getBooks().map((b) => ({ book: b.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ book: string }>;
}) {
  const { book } = await params;
  const meta = getBooks().find((b) => b.id === book);
  return { title: meta ? `${meta.title} — Читальня` : "Читальня" };
}

// Страница книги: список рассказов с превью первой строки. Порядок — из books/*.json.
export default async function BookPage({
  params,
}: {
  params: Promise<{ book: string }>;
}) {
  const { book } = await params;
  const meta = getBooks().find((b) => b.id === book);
  if (!meta) notFound();
  const bySlug = new Map(getAllStories().map((s) => [s.slug, s]));

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <Link href="/read" className="hover:text-foreground">
          ← Читальня
        </Link>
      </p>
      <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-balance">
        {meta.title}
      </h1>
      <p className="mt-2 font-mono text-sm text-muted-foreground">{meta.year}</p>

      <ol className="mt-12 space-y-7">
        {meta.stories.map((slug, i) => {
          const story = bySlug.get(slug);
          if (!story) return null;
          return (
            <li key={slug}>
              <Link href={`/read/${meta.id}/${slug}`} className="group block">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-serif text-xl group-hover:text-sodium">
                    {story.title}
                  </h2>
                </div>
                <p className="mt-1 pl-9 font-serif leading-prose text-muted-foreground line-clamp-2">
                  {story.firstLine}
                </p>
              </Link>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
