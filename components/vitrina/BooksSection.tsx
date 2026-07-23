import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { AccentLine } from "@/components/motion/AccentLine";
import { renderInline } from "@/components/reader/ProseBody";
import { applyTypograf, romanYear } from "@/lib/typograf";
import { bookPresentation, type BookPresentation } from "@/content/bookPresentation";
import { themes } from "@/content/themes";
import { BOOK_IDS, type Book } from "@/content/schema";

// Книги как объекты (§9): уважительная editorial-подача вместо карточек-плиток.
// Два разворота «обложка + сведения» (второй зеркальный) и третья книга — намеренно
// НЕ объект, а стопка черновиков, ведущая в Мастерскую. Серверный компонент: ни
// строчки клиентского JS, кроме уже существующей границы <Reveal> (проявление в кадре
// с reduced-motion-паритетом, §10). Физичность обложек — в globals.css.
//
// Две колонки включаются на lg, а не на 760px как в прототипе: контейнер страницы до
// lg — max-w-2xl, и сетка «340px + 1fr» оставила бы сведениям ~236px.

const TOTAL_BOOKS = BOOK_IDS.length; // 3 = две изданные + третья в работе
const themeLabel = new Map(themes.map((t) => [t.id, t.label]));

const NUM = "font-mono text-[10px] uppercase tracking-[0.2em] books-faint";
const META =
  "mt-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground";
const SAY =
  "mt-5 max-w-[44ch] font-serif text-[1.06rem] leading-[1.65] text-muted-foreground [&_em]:text-foreground";
// Действие: текст остаётся --foreground, тёплое — только подчёркивание. Натрий как
// ЦВЕТ ТЕКСТА на бумаге даёт 1.7:1 (провал AA), поэтому hover утолщает черту, а не
// красит буквы; padding компенсирует прирост, чтобы строка не прыгала.
const ACTION =
  "mt-7 inline-block border-b border-sodium pb-[3px] font-sans text-[0.95rem] transition-[border-width,padding-bottom] hover:border-b-2 hover:pb-[2px]";
// Колонки задаются ОДНИМ классом на разворот: две конкурирующие grid-cols в одном
// className разрешаются порядком в CSS, а не порядком в строке — зеркальный разворот
// молча получал 340px под сведения вместо 1fr.
const SPREAD = "grid items-center gap-9 lg:gap-[clamp(2rem,6vw,4.5rem)]";
const COLS = "lg:grid-cols-[340px_1fr]";
const COLS_MIRROR = "lg:grid-cols-[1fr_340px]";

/** Типографический макет обложки. Реальных ассетов в репозитории нет — до их
 *  появления это штатный вид (docs/задачи.md). aria-hidden: автор, титул, «рассказы»
 *  и год дословно повторены в колонке сведений, дубль для скринридера вреден. */
function CoverMock({ book, skin, glyph }: { book: Book } & Pick<BookPresentation, "skin" | "glyph">) {
  return (
    <div className="book-object" data-skin={skin} aria-hidden>
      <div className="book-object__cover flex flex-col text-center">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] opacity-65">
          Евгений Кирилов
        </p>
        <p className="mt-auto font-serif text-[clamp(1.7rem,2.6vw,2.15rem)] font-medium leading-[1.12]">
          {book.title}
        </p>
        <span className="mx-auto mt-3.5 block h-px w-[34px] bg-current opacity-45" />
        <p className="mt-3 mb-auto font-serif text-[0.85rem] italic opacity-70">
          рассказы
        </p>
        {glyph && (
          <span className="book-object__glyph relative mx-auto mb-3.5 block size-[30px] rounded-full border border-current">
            <span className="absolute top-1/2 left-1/2 size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
          </span>
        )}
        <p className="font-mono text-[10px] tracking-[0.18em] opacity-60">
          {romanYear(book.year)}
        </p>
      </div>
    </div>
  );
}

/** Разворот изданной книги: объект слева, сведения справа (или наоборот). */
function BookSpread({
  book,
  presentation,
  index,
}: {
  book: Book;
  presentation: BookPresentation;
  index: number;
}) {
  const { skin, mirror, glyph, pubsay, themes: bookThemes } = presentation;

  return (
    <Reveal>
      <article
        className={`mt-[4.75rem] ${SPREAD} ${mirror ? COLS_MIRROR : COLS}`}
      >
        <div className={`justify-self-center ${mirror ? "lg:order-2" : ""}`}>
          <CoverMock book={book} skin={skin} glyph={glyph} />
        </div>

        <div>
          <p className={NUM}>
            книга {String(index + 1).padStart(2, "0")} / 0{TOTAL_BOOKS}
          </p>
          <h3 className="mt-2.5 font-serif text-3xl font-medium tracking-tight">
            {book.title}
          </h3>
          <p className={META}>
            <b className="font-medium text-foreground">{book.year}</b> ·{" "}
            {book.stories.length} рассказов · издана
          </p>
          <p className={SAY}>{renderInline(applyTypograf(pubsay))}</p>

          <div className="mt-6">
            <p className="mb-2.5 font-mono text-[9.5px] uppercase tracking-[0.16em] books-faint">
              стоит на темах Колеса
            </p>
            {/* Ведут к своей теме в доступном индексе «Колеса» — там якорь
                #theme-<id> сам раскрывает <details> с рассказами. */}
            <ul className="flex flex-wrap gap-2.5">
              {bookThemes.map((id) => (
                <li key={id}>
                  <a
                    href={`#theme-${id}`}
                    className="inline-block rounded-full border border-border px-3 py-[5px] font-sans text-[0.82rem] text-muted-foreground transition-colors hover:border-sodium hover:text-foreground"
                  >
                    {themeLabel.get(id)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <Link href={`/read/${book.id}`} className={ACTION}>
            Читать в Читальне →
          </Link>
        </div>
      </article>
    </Reveal>
  );
}

/** Третья книга: ещё не объект. Стопка черновиков вместо обложки. */
function DraftsBand() {
  return (
    <Reveal>
      <article className={`mt-24 border-t border-border pt-16 ${SPREAD} ${COLS}`}>
        <div
          className="justify-self-center"
          role="img"
          aria-label="Стопка черновиков третьей книги"
        >
          <div className="draft-stack">
            <div className="draft-sheet draft-sheet--1" />
            <div className="draft-sheet draft-sheet--2" />
            <div className="draft-sheet draft-sheet--3 px-5 py-[22px]">
              <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] books-faint">
                <span className="size-[6px] shrink-0 bg-sodium" aria-hidden />
                черновик · фрагмент 07
              </p>
              {/* МАКЕТ-ЗАГЛУШКА: свой фрагмент — за автором (docs/задачи.md). */}
              <p className="mt-3.5 font-serif text-base leading-[1.65] text-muted-foreground italic">
                Лифт остановился между этажами — <s>и погас свет</s> и кто-то
                вежливо кашлянул.
              </p>
              <div className="draft-lines mt-4" />
            </div>
            <div className="draft-clip" aria-hidden />
          </div>
        </div>

        <div>
          <p className={NUM}>
            книга 0{TOTAL_BOOKS} / 0{TOTAL_BOOKS} · в работе
          </p>
          <h3 className="mt-2.5 font-serif text-3xl font-medium tracking-tight">
            Без названия
          </h3>
          <p className={META}>пишется сейчас · фрагменты и заметки</p>
          <p className={SAY}>
            Третья книга — ещё не объект: стопка черновиков растёт на глазах.
            Фрагменты, вычеркнутые строки и новые иллюстрации выкладываются по
            мере письма.
          </p>
          <Link href="/workshop" className={ACTION}>
            Зайти в Мастерскую →
          </Link>
        </div>
      </article>
    </Reveal>
  );
}

export function BooksSection({ books }: { books: Book[] }) {
  return (
    <section
      id="books"
      aria-labelledby="books-heading"
      className="books-objects mt-24"
    >
      <Reveal>
        <h2
          id="books-heading"
          className="font-serif text-2xl font-medium tracking-tight"
        >
          Книги
        </h2>
        <AccentLine className="mt-3" />
        <p className="mt-4 max-w-[52ch] font-serif text-lg leading-[1.7] text-muted-foreground">
          Две изданные книги — тридцать четыре рассказа. Третья пишется на
          глазах, в Мастерской.
        </p>
      </Reveal>

      {books.map((book, i) => {
        const presentation = bookPresentation[book.id];
        // Книга без редакционной подачи (например, третья) разворотом не рисуется.
        if (!presentation) return null;
        return (
          <BookSpread
            key={book.id}
            book={book}
            presentation={presentation}
            index={i}
          />
        );
      })}

      <DraftsBand />

      <Reveal>
        <div className="mt-[5.5rem] flex flex-wrap justify-between gap-4 border-t border-border pt-6 font-mono text-[9.5px] uppercase tracking-[0.14em] books-faint">
          <p>littera scripta manet — написанное слово остаётся</p>
          <p>
            {books.length} изданы · {TOTAL_BOOKS - books.length} в работе
          </p>
        </div>
      </Reveal>
    </section>
  );
}
