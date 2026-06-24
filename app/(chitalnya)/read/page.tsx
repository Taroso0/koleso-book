import Link from "next/link";
import { getBooks, getAllStories } from "@/lib/content";

export const metadata = { title: "Читальня — Боковым зрением" };

// Индекс «Читальни»: список книг и рассказов (порядок — из content/books/*.json). SSG.
export default function ReadIndex() {
  const books = getBooks().sort((a, b) => a.year - b.year);
  const bySlug = new Map(getAllStories().map((s) => [s.slug, s]));

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          ← Витрина
        </Link>
      </p>
      <h1 className="mt-4 font-sans text-3xl font-medium tracking-tight">Читальня</h1>
      <p className="mt-4 font-serif text-lg leading-prose text-muted-foreground">
        Две книги, тридцать четыре рассказа. Нативный скролл — без инерции:
        длинный текст несовместим с инерционным движением.
      </p>

      <div className="mt-12 space-y-12">
        {books.map((book) => (
          <section key={book.id}>
            <h2 className="font-sans text-xl font-medium tracking-tight">
              <Link
                href={`/read/${book.id}`}
                className="underline-offset-4 hover:underline"
              >
                {book.title}
              </Link>
              <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">
                {book.year}
              </span>
            </h2>
            <ol className="mt-4 space-y-1.5">
              {book.stories.map((slug, i) => {
                const story = bySlug.get(slug);
                if (!story) return null;
                return (
                  <li key={slug} className="flex gap-3 font-serif">
                    <span className="font-mono text-sm tabular-nums text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Link
                      href={`/read/${book.id}/${slug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {story.title}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </main>
  );
}
