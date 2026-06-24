import Link from "next/link";
import { getBooks } from "@/lib/content";
import { cn } from "@/lib/utils";

// Переключатель книг «Читальни» (§8). Data-driven по getBooks(): показывает читаемые
// книги (сейчас 2 изданные); 3-я («Мастерская») — раздел Витрины (Фаза 5), не книга чтения.
export function BookSwitcher({ current }: { current?: string }) {
  const books = getBooks().sort((a, b) => a.year - b.year);
  return (
    <nav
      aria-label="Книги"
      className="flex flex-wrap gap-1 font-mono text-xs uppercase tracking-wider"
    >
      {books.map((book) => {
        const active = book.id === current;
        return (
          <Link
            key={book.id}
            href={`/read/${book.id}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-sm px-2.5 py-1 transition-colors",
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {book.title}
          </Link>
        );
      })}
    </nav>
  );
}
