import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReduceMotionToggle } from "@/components/motion/ReduceMotionToggle";
import { WheelIndex } from "@/components/wheel/WheelIndex";
import { WheelGraph } from "@/components/wheel/WheelGraph";
import { getAllStories } from "@/lib/content";
import { themes } from "@/content/themes";
import { buildGraph } from "@/lib/graph";
import { computeWheelLayout } from "@/lib/wheelLayout";
import { BOOK_IDS } from "@/content/schema";

// Хаб и точка входа — «Колесо» (§3). Шаг 3.2: визуальный граф d3-force (десктоп,
// остров ssr:false) ПОВЕРХ канонического доступного индекса <WheelIndex />.
// Укладка считается здесь, на сборке (предрасчёт, §11-B2), и передаётся пропсом.
export default function VitrinaHome() {
  const stories = getAllStories().sort(
    (a, b) =>
      BOOK_IDS.indexOf(a.book) - BOOK_IDS.indexOf(b.book) || a.order - b.order,
  );
  const graph = buildGraph(stories, themes);
  const layout = computeWheelLayout(graph);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 lg:max-w-5xl">
      <header className="mx-auto max-w-2xl space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          боковым зрением · Евгений Кирилов
        </p>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-balance">
          Боковым зрением
        </h1>
        <p className="font-serif text-lg leading-[1.7] text-muted-foreground">
          Чудо живёт не в космосе, а в обыденном — в офисе, фонаре, на скамейке.
          Его видно боковым зрением.
        </p>
      </header>

      {/* Граф «Колеса» — десктоп-улучшение поверх индекса (на мобильном не рендерится). */}
      <div className="mt-12 hidden lg:block">
        <WheelGraph graph={graph} layout={layout} />
      </div>

      {/* Канонический доступный двойник — всегда в DOM. */}
      <div className="mx-auto mt-12 max-w-2xl">
        <WheelIndex graph={graph} />
      </div>

      <footer className="mx-auto mt-16 flex max-w-2xl flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button asChild>
          <Link href="/read">Войти в Читальню</Link>
        </Button>
        <ReduceMotionToggle />
      </footer>
    </main>
  );
}
