import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReduceMotionToggle } from "@/components/motion/ReduceMotionToggle";
import { WheelIndex } from "@/components/wheel/WheelIndex";
import { getAllStories } from "@/lib/content";
import { themes } from "@/content/themes";
import { buildGraph } from "@/lib/graph";
import { BOOK_IDS } from "@/content/schema";

// Хаб и точка входа — «Колесо» (§3). Шаг 3.1: каноническая навигация — доступный
// двойник <WheelIndex />. Визуальный граф d3-force ляжет поверх индекса (Шаг 3.2).
export default function VitrinaHome() {
  const stories = getAllStories().sort(
    (a, b) =>
      BOOK_IDS.indexOf(a.book) - BOOK_IDS.indexOf(b.book) || a.order - b.order,
  );
  const graph = buildGraph(stories, themes);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <header className="space-y-2">
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

      <div className="mt-14">
        <WheelIndex graph={graph} />
      </div>

      <footer className="mt-16 flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button asChild>
          <Link href="/read">Войти в Читальню</Link>
        </Button>
        <ReduceMotionToggle />
      </footer>
    </main>
  );
}
