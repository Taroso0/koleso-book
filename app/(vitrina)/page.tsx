import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReduceMotionToggle } from "@/components/motion/ReduceMotionToggle";
import { Reveal } from "@/components/motion/Reveal";
import { AccentLine } from "@/components/motion/AccentLine";
import { FogReveal } from "@/components/haunted/FogReveal";
import { WarmWindowHero } from "@/components/vitrina/WarmWindowHero";
import { WheelIndex } from "@/components/wheel/WheelIndex";
import { WheelGraph } from "@/components/wheel/WheelGraph";
import { getAllStories, getBooks } from "@/lib/content";
import { themes } from "@/content/themes";
import { buildGraph } from "@/lib/graph";
import { computeWheelLayout } from "@/lib/wheelLayout";
import { BOOK_IDS } from "@/content/schema";

// Хаб и точка входа — «Колесо» (§3/§9). Шаг 4.1: хаб-лендинг со скролл-сценами
// «Витрины» (§7). Герой (Колесо) спокоен; ниже по скроллу проявляются тизеры-«лучи»
// Автор/Книги/Мастерская — движется только проявление (§10), всё под reduced-motion.
// Укладка графа считается здесь, на сборке (предрасчёт, §11-B2).
export default function VitrinaHome() {
  const stories = getAllStories().sort(
    (a, b) =>
      BOOK_IDS.indexOf(a.book) - BOOK_IDS.indexOf(b.book) || a.order - b.order,
  );
  const graph = buildGraph(stories, themes);
  const layout = computeWheelLayout(graph);
  const books = getBooks().sort(
    (a, b) => BOOK_IDS.indexOf(a.id) - BOOK_IDS.indexOf(b.id),
  );

  return (
    <main id="main" tabIndex={-1}>
      {/* Первый экран — «Тёплое окно»: окно горит с первого пикселя (§4/§8/§10).
          Несёт единственный <h1> страницы; full-bleed, вне контентного контейнера. */}
      <WarmWindowHero />

      <div className="mx-auto max-w-2xl px-6 py-16 lg:max-w-5xl">
        {/* «Колесо» — цель якоря «↓ блуждать по Колесу» из hero. */}
        <div id="wheel" className="scroll-mt-8">
          {/* Граф — десктоп-улучшение поверх индекса (на мобильном не рендерится).
              «Карта смыслов проявляется из тумана» (FogReveal, §8). */}
          <FogReveal className="hidden lg:block">
            <WheelGraph graph={graph} layout={layout} />
          </FogReveal>

          {/* Канонический доступный двойник — всегда в DOM. */}
          <div className="mx-auto mt-12 max-w-2xl">
            <WheelIndex graph={graph} />
          </div>
        </div>

      {/* Скролл-сцены хаба: тизеры-«лучи» к разделам. Проявляются при входе в кадр. */}

      {/* TODO: финальный текст «Автор» — за автором (голос §2/§6). */}
      <section
        id="author"
        aria-labelledby="author-heading"
        className="mx-auto mt-24 max-w-2xl"
      >
        <Reveal>
          <h2
            id="author-heading"
            className="font-serif text-2xl font-medium tracking-tight"
          >
            Автор
          </h2>
          <AccentLine className="mt-3" />
          <p className="mt-4 font-serif text-lg leading-[1.7] text-muted-foreground">
            Евгений Кирилов пишет «офисную готику» — чудо, спрятанное в сером
            корпоративном быту: в опенспейсе, в фонаре в три часа ночи, в
            системном уведомлении. Тёпло, иронично, по-человечески — а не
            торжественно.
          </p>
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Скоро
          </p>
        </Reveal>
      </section>

      {/* Книги как объекты (§9). Карточки ведут в Читальню (существующий маршрут). */}
      <section
        id="books"
        aria-labelledby="books-heading"
        className="mx-auto mt-24 max-w-2xl"
      >
        <Reveal>
          <h2
            id="books-heading"
            className="font-serif text-2xl font-medium tracking-tight"
          >
            Книги
          </h2>
          <AccentLine className="mt-3" />
          <p className="mt-4 font-serif text-lg leading-[1.7] text-muted-foreground">
            Две изданные книги и третья в работе.
          </p>
        </Reveal>
        <Reveal stagger={0.06} className="mt-6 grid gap-4 sm:grid-cols-2">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/read/${book.id}`}
              className="group rounded-sm border border-border p-5 transition-colors hover:border-foreground/40"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {book.year}
              </p>
              <h3 className="mt-1 font-serif text-xl font-medium">
                {book.title}
              </h3>
              <p className="mt-2 font-sans text-sm text-muted-foreground">
                {book.stories.length} рассказов
              </p>
              <span className="mt-3 inline-block font-sans text-sm underline-offset-4 group-hover:underline">
                Читать →
              </span>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* Мастерская — 3-я книга building-in-public (§9/§11-A3). Маршрут — позже. */}
      <section
        id="workshop"
        aria-labelledby="workshop-heading"
        className="mx-auto mt-24 max-w-2xl"
      >
        <Reveal>
          <h2
            id="workshop-heading"
            className="font-serif text-2xl font-medium tracking-tight"
          >
            Мастерская
          </h2>
          <AccentLine className="mt-3" />
          <p className="mt-4 font-serif text-lg leading-[1.7] text-muted-foreground">
            Третья книга растёт на глазах: фрагменты, черновики, заметки и новые
            иллюстрации. Building-in-public для художественной прозы.
          </p>
          <Link
            href="/workshop"
            className="mt-4 inline-block font-sans text-sm underline-offset-4 hover:underline"
          >
            Зайти в Мастерскую →
          </Link>
        </Reveal>
      </section>

      <Reveal>
        <footer className="mx-auto mt-24 flex max-w-2xl flex-wrap items-center gap-4 border-t border-border pt-6">
          <Button asChild>
            <Link href="/read">Войти в Читальню</Link>
          </Button>
          <ReduceMotionToggle />
          <Link
            href="/contacts"
            className="ml-auto font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            Контакты
          </Link>
        </footer>
      </Reveal>
      </div>
    </main>
  );
}
