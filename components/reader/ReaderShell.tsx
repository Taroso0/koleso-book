"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { cn } from "@/lib/utils";
import {
  applyReadingTheme,
  getProgress,
  getReadingMode,
  getReadingTheme,
  saveProgress,
  setReadingMode,
  type ReadingMode,
  type ReadingTheme,
} from "./reading";

const GAP = 48; // px между «страницами» в постраничном режиме

const THEMES: { id: ReadingTheme; label: string }[] = [
  { id: "light", label: "Светлая" },
  { id: "sepia", label: "Сепия" },
  { id: "dark", label: "Тёмная" },
];

// Клиентская оболочка чтения (Шаг 2.3): постраничный режим (CSS-колонки),
// прогресс в localStorage (восстановление позиции, «продолжить»), темы чтения.
// Под reduced-motion переход страниц — без анимации. Контент (children) отрисован
// на сервере (typograf на сборке) и лишь оборачивается режимом отображения.
export function ReaderShell({
  slug,
  bookId,
  bookTitle,
  title,
  children,
}: {
  slug: string;
  bookId: string;
  bookTitle: string;
  title: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotionSafe();

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ReadingMode>("scroll");
  const [theme, setTheme] = useState<ReadingTheme>("light");

  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [measured, setMeasured] = useState(false);
  const [colWidth, setColWidth] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);

  // Прочитать сохранённые настройки после монтирования (избегаем SSR-расхождения).
  useEffect(() => {
    setMode(getReadingMode());
    setTheme(getReadingTheme());
    setMounted(true);
  }, []);

  // --- Постраничный режим: измерение колонок ---
  // Высота «страницы» задаётся из CSS (стабильна, НЕ зависит от позиции скролла).
  // JS меряет только ширину колонки и общую ширину контента → число страниц.
  const measure = useCallback(() => {
    const vp = viewportRef.current;
    const ct = contentRef.current;
    if (!vp || !ct) return;
    const w = vp.clientWidth;
    setColWidth(w);
    // scrollWidth корректен после применения стилей колонок — читаем в следующем кадре.
    requestAnimationFrame(() => {
      const count = Math.max(1, Math.round((ct.scrollWidth + GAP) / (w + GAP)));
      setPageCount(count);
      setPage((p) => Math.min(p, count - 1));
      setMeasured(true);
    });
  }, []);

  useLayoutEffect(() => {
    if (!mounted || mode !== "paged") return;
    measure();
    const vp = viewportRef.current;
    const ro = new ResizeObserver(() => measure());
    if (vp) ro.observe(vp);
    document.fonts?.ready.then(() => measure());
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, [mounted, mode, measure]);

  // При входе в постраничный режим — к началу страницы (пагинатор прижат к верху).
  useEffect(() => {
    if (mounted && mode === "paged") window.scrollTo(0, 0);
  }, [mounted, mode]);

  // Восстановление позиции (один раз) — когда раскладка готова.
  useEffect(() => {
    if (!mounted || restoredRef.current) return;
    const pct = getProgress(slug);
    if (mode === "paged") {
      if (!measured) return;
      setPage(pageCount > 1 ? Math.round(pct * (pageCount - 1)) : 0);
      restoredRef.current = true;
    } else {
      const id = requestAnimationFrame(() => {
        const max =
          document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, Math.max(0, pct * max));
        restoredRef.current = true;
      });
      return () => cancelAnimationFrame(id);
    }
  }, [mounted, mode, measured, pageCount, slug]);

  const persist = useCallback(
    (pct: number) => saveProgress({ slug, bookId, bookTitle, title, pct }),
    [slug, bookId, bookTitle, title],
  );

  // Сохранение прогресса при скролле (непрерывный режим).
  useEffect(() => {
    if (!mounted || mode !== "scroll") return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!restoredRef.current) return;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        persist(max > 0 ? window.scrollY / max : 0);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mounted, mode, persist]);

  // Сохранение прогресса при смене страницы (постраничный режим).
  useEffect(() => {
    if (!mounted || mode !== "paged" || !restoredRef.current || pageCount <= 1) {
      return;
    }
    persist(page / (pageCount - 1));
  }, [mounted, mode, page, pageCount, persist]);

  // Клавиатура в постраничном режиме.
  useEffect(() => {
    if (mode !== "paged") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        setPage((p) => Math.min(pageCount - 1, p + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setPage((p) => Math.max(0, p - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, pageCount]);

  const changeMode = (m: ReadingMode) => {
    restoredRef.current = false;
    if (m === "paged") setMeasured(false);
    setMode(m);
    setReadingMode(m);
  };
  const changeTheme = (t: ReadingTheme) => {
    setTheme(t);
    applyReadingTheme(t);
  };

  const paged = mounted && mode === "paged";

  return (
    <>
      {paged ? (
        <div ref={viewportRef} className="h-[calc(100svh-9rem)] overflow-hidden">
          <div
            ref={contentRef}
            className="reading-paged h-full"
            style={{
              columnWidth: colWidth ? `${colWidth}px` : undefined,
              columnGap: `${GAP}px`,
              transform: colWidth
                ? `translateX(-${page * (colWidth + GAP)}px)`
                : undefined,
              transition: reduced ? undefined : "transform 350ms ease",
            }}
          >
            {children}
          </div>
        </div>
      ) : (
        <div>{children}</div>
      )}

      {mounted && (
        <div className="sticky bottom-0 z-10 mt-8 border-t border-border bg-card/85 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <div
            role="toolbar"
            aria-label="Настройки чтения"
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 font-mono text-xs"
          >
            <SegGroup label="Режим">
              <Seg active={mode === "scroll"} onClick={() => changeMode("scroll")}>
                Свиток
              </Seg>
              <Seg active={mode === "paged"} onClick={() => changeMode("paged")}>
                Страницы
              </Seg>
            </SegGroup>

            {paged && pageCount > 1 && (
              <div className="flex items-center gap-3" aria-live="polite">
                <button
                  type="button"
                  aria-label="Предыдущая страница"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-1 hover:text-foreground disabled:opacity-30"
                >
                  ←
                </button>
                <span className="tabular-nums text-muted-foreground">
                  {page + 1} / {pageCount}
                </span>
                <button
                  type="button"
                  aria-label="Следующая страница"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  className="px-1 hover:text-foreground disabled:opacity-30"
                >
                  →
                </button>
              </div>
            )}

            <SegGroup label="Тема">
              {THEMES.map((t) => (
                <Seg
                  key={t.id}
                  active={theme === t.id}
                  onClick={() => changeTheme(t.id)}
                >
                  {t.label}
                </Seg>
              ))}
            </SegGroup>
          </div>
        </div>
      )}
    </>
  );
}

function SegGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}

function Seg({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-sm px-2 py-1 uppercase tracking-wider transition-colors",
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
