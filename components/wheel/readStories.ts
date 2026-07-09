"use client";

import { useEffect, useState } from "react";
import {
  PROGRESS_EVENT,
  isProgressKey,
  isRead,
} from "@/components/reader/reading";
import type { WheelGraph } from "@/lib/graph";

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

/** Slugs рассказов, дочитанных до конца. Источник правды — прогресс «Читальни»
 *  (`kirilov:reading:progress:<slug>`), «Колесо» его только читает.
 *
 *  Пусто до маунта: WheelCanvas грузится через next/dynamic ssr:false, так что
 *  расхождения гидрации нет, а пост-маунтовый пересчёт даёт видимое «оседание»
 *  карты вокруг прочитанного — это и есть §8 «прочтение перестраивает Колесо». */
export function useReadStories(graph: WheelGraph): ReadonlySet<string> {
  const [read, setRead] = useState<ReadonlySet<string>>(() => new Set<string>());

  useEffect(() => {
    const slugs = graph.nodes.filter((n) => n.kind === "story").map((n) => n.id);
    const recompute = () => {
      const next = new Set(slugs.filter(isRead));
      // Новый Set на каждое событие пересобирал бы укладку — сверяем состав.
      setRead((prev) => (sameSet(prev, next) ? prev : next));
    };
    recompute();

    // Прогресс изменился: в этой вкладке — CustomEvent, в соседней — storage.
    const onStorage = (e: StorageEvent) => {
      if (isProgressKey(e.key)) recompute();
    };
    window.addEventListener(PROGRESS_EVENT, recompute);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, recompute);
      window.removeEventListener("storage", onStorage);
    };
  }, [graph]);

  return read;
}
