"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLastRead, type LastRead } from "./reading";

// «Продолжить чтение» (Шаг 2.3): ссылка на последний открытый рассказ + прогресс.
// Рендерится только после монтирования (данные из localStorage) — без SSR-расхождения.
export function ContinueReading() {
  const [last, setLast] = useState<LastRead | null>(null);

  useEffect(() => {
    setLast(getLastRead());
  }, []);

  if (!last) return null;
  const percent = Math.round(last.pct * 100);

  return (
    <Link
      href={`/read/${last.bookId}/${last.slug}`}
      className="group mt-8 block rounded-sm border border-border bg-card p-4 transition-colors hover:border-sodium/60"
    >
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Продолжить · {last.bookTitle} · {percent}%
      </p>
      <p className="mt-1 font-serif text-lg underline-offset-4 group-hover:underline">
        {last.title}
      </p>
      <div
        className="mt-3 h-1 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Прогресс чтения"
      >
        <div className="h-full bg-sodium" style={{ width: `${percent}%` }} />
      </div>
    </Link>
  );
}
