import Link from "next/link";
import type { Book, Story } from "@/content/schema";
import { getIllustration } from "@/lib/illustrations";
import { BookSwitcher } from "./BookSwitcher";
import { IllustrationPlate } from "./IllustrationPlate";
import { ProseBody } from "./ProseBody";
import { ReaderShell } from "./ReaderShell";

type Adjacent = { slug: string; title: string };

// Типографика-first среда чтения (§6): узкая колонка измерения, широкие поля,
// высокий контраст (WCAG AA), editorial-плашка иллюстрации «с воздухом».
// Среда «Читальни» статична: ни Lenis, ни тяжёлого моушена (комфорт длинного текста).
export function Reader({
  book,
  story,
  prev,
  next,
}: {
  book: Book;
  story: Story;
  prev?: Adjacent;
  next?: Adjacent;
}) {
  const illustration = getIllustration(story, book);
  const number = String(story.order).padStart(2, "0");

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
      <header className="sticky top-0 z-10 -mx-6 flex items-center justify-between gap-4 border-b border-border bg-background/80 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <Link
          href="/read"
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Читальня
        </Link>
        <BookSwitcher current={book.id} />
      </header>

      <ReaderShell
        key={story.slug}
        slug={story.slug}
        bookId={book.id}
        bookTitle={book.title}
        title={story.title}
      >
        <article className="mt-10">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {book.title} · {number}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-balance">
            {story.title}
          </h1>

          {illustration && (
            <IllustrationPlate illustration={illustration} priority />
          )}

          <div className="mt-10 font-serif text-lg leading-prose text-foreground">
            <ProseBody body={story.body} />
          </div>
        </article>
      </ReaderShell>

      <nav className="mt-16 flex justify-between gap-6 border-t border-border pt-6 font-sans text-sm">
        {prev ? (
          <Link href={`/read/${book.id}/${prev.slug}`} className="group max-w-[45%]">
            <span className="block font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Назад
            </span>
            <span className="underline-offset-4 group-hover:underline">
              ← {prev.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/read/${book.id}/${next.slug}`}
            className="group max-w-[45%] text-right"
          >
            <span className="block font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Дальше
            </span>
            <span className="underline-offset-4 group-hover:underline">
              {next.title} →
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
