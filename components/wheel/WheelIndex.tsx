import Link from "next/link";
import { groupByTheme, type WheelGraph } from "@/lib/graph";

// Доступный двойник «Колеса» (§5/§11-B1): семантический список «тема → рассказы».
// Это КАНОНИЧЕСКАЯ навигация — полностью доступна с клавиатуры и скринридером
// (нативные ссылки + заголовки + landmark). Визуальный граф (Шаг 3.2) — улучшение
// поверх. Серверный компонент: без JS, статичен (SSG). На мобильном — основной вид.
export function WheelIndex({ graph }: { graph: WheelGraph }) {
  const groups = groupByTheme(graph);

  return (
    <nav aria-labelledby="wheel-heading" className="space-y-8">
      <div className="space-y-3">
        <h2
          id="wheel-heading"
          className="font-serif text-2xl font-medium tracking-tight"
        >
          Колесо
        </h2>
        <p className="font-serif leading-[1.7] text-muted-foreground">
          Десять понятий и рассказы на их пересечениях. Выберите тему или сразу
          рассказ — каждый стоит на нескольких темах.
        </p>
      </div>

      {/* Быстрый переход к теме (якоря) */}
      <ul
        aria-label="Перейти к теме"
        className="flex flex-wrap gap-2 font-mono text-xs uppercase tracking-wider"
      >
        {groups.map(({ theme, stories }) => (
          <li key={theme.id}>
            <a
              href={`#theme-${theme.id}`}
              className="inline-flex items-center gap-1 rounded-sm border border-border px-2.5 py-1 text-muted-foreground transition-colors hover:border-sodium/60 hover:text-foreground"
            >
              {theme.label}
              <span className="tabular-nums text-muted-foreground">
                {stories.length}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/* Секции тем — свёрнуты по умолчанию, раскрываются по клику.
          Нативный <details>: работает без JS, доступен с клавиатуры и
          скринридера. Переход по якорю-чипу сам раскрывает нужную тему. */}
      <div className="space-y-1">
        {groups.map(({ theme, stories }) => (
          <section key={theme.id} aria-labelledby={`theme-${theme.id}`}>
            <details className="wheel-disclosure group border-b border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-3 [&::-webkit-details-marker]:hidden">
                <h3
                  id={`theme-${theme.id}`}
                  className="scroll-mt-6 font-serif text-lg font-medium tracking-tight"
                >
                  {theme.label}
                  <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">
                    · {stories.length}
                  </span>
                </h3>
                {/* Индикатор раскрытия */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4 shrink-0 text-muted-foreground transition-[rotate] duration-200 group-open:rotate-180 motion-reduce:transition-none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              {stories.length > 0 ? (
                <ul className="mb-4 space-y-1.5 font-serif">
                  {stories.map((s) => (
                    <li key={`${theme.id}-${s.id}`}>
                      <Link
                        href={`/read/${s.book}/${s.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {s.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-4 font-serif text-muted-foreground">
                  Пока нет рассказов.
                </p>
              )}
            </details>
          </section>
        ))}
      </div>
    </nav>
  );
}
