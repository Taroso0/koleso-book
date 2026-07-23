import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReduceMotionToggle } from "@/components/motion/ReduceMotionToggle";
import { Reveal } from "@/components/motion/Reveal";
import { FogReveal } from "@/components/haunted/FogReveal";
import { WarmWindowHero } from "@/components/vitrina/WarmWindowHero";
import { BooksSection } from "@/components/vitrina/BooksSection";
import {
  ServiceRunHead,
  ServiceRunFoot,
  AuthorSheet,
  WorkshopDesk,
} from "@/components/vitrina/OfficeByDay";
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
          Несёт единственный <h1> страницы; full-bleed, вне контентного контейнера.
          Пре-пейнт гейт зачина (data-zachin-boot) живёт в корневом app/layout.tsx. */}
      <WarmWindowHero />

      {/* Якорь «Колеса» — всегда в потоке (0-высоты, шва не рисует). Десктоп: стоит
          перед full-bleed ночью → «↓ блуждать по Колесу» лендит на граф. Мобильный:
          ночь/рассвет — display:none (0px), поэтому якорь лендит на двойник ниже.
          Отдельный якорь (а не id на секции): нативный скролл к display:none-секции
          не сработал бы, а кнопка должна работать по-прежнему на обоих экранах. */}
      <div id="wheel" className="scroll-mt-8" />

      {/* Ночь созвездия — full-bleed, прилегает к hero ВПЛОТНУЮ (тот же --night → шва
          нет). .dark → --foreground светлый: натрий и подписи узлов читаются «в ночи»
          (§4/§8). «Карта проявляется из тумана» (FogReveal). Только десктоп — граф —
          улучшение поверх доступного двойника. */}
      <section
        aria-label="Колесо тем"
        className="wheel-night dark hidden lg:block"
      >
        <div className="mx-auto max-w-5xl px-6">
          <FogReveal>
            <WheelGraph graph={graph} layout={layout} />
          </FogReveal>
        </div>
      </section>

      {/* «Рассвет»: ночь растворяется в бумагу (§4 — свет как событие). Full-bleed,
          вплотную к ночи; только десктоп (на мобильном ночи нет). */}
      <div className="dawn-strip hidden lg:block" aria-hidden />

      <div className="mx-auto max-w-2xl px-6 py-16 lg:max-w-5xl">
        {/* Канонический доступный двойник — на светлом, в .dark НЕ заворачивать.
            Верхний отступ даёт py-16 контейнера (не mt-12) — без двойного зазора. */}
        <div className="mx-auto max-w-2xl">
          <WheelIndex graph={graph} />
        </div>

      {/* Скролл-сцены хаба: светлые «служебные страницы» — офис днём (§4, Шаг 8).
          «Автор» (личный лист) и «Мастерская» (стол) — рабочее поле с пометками на
          полях; между ними «Книги» как объекты (§9, своя editorial-подача). Все три
          читаются одним светлым документом; колонтитулы открывают и закрывают его. */}
      <div className="office-day mt-24">
        <ServiceRunHead />
        <AuthorSheet />
      </div>

      {/* Книги как объекты (§9): editorial-развороты во всю ширину контейнера — книги
          главные экспонаты «Витрины», а не плитки каталога. Своя кода с девизом. */}
      <BooksSection books={books} />

      {/* Мастерская — 3-я книга building-in-public (§9/§11-A3); ссылка ведёт на /workshop.
          Ниже — нижний колонтитул, закрывающий светлый документ. */}
      <div className="office-day mt-24">
        <WorkshopDesk />
        <ServiceRunFoot />
      </div>

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
