import { cn } from "@/lib/utils";
import type { WorkshopKind } from "@/content/schema";

// Метки видов записей «Мастерской» — единый словарь (карточка + страница записи).
export const KIND_LABELS: Record<WorkshopKind, string> = {
  fragment: "Фрагмент",
  draft: "Черновик",
  note: "Заметка",
  illustration: "Иллюстрация",
};

// Mono-чип вида записи («система» из дуальной типографики, §5). Серверный компонент.
export function KindBadge({
  kind,
  className,
}: {
  kind: WorkshopKind;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-sm border border-border px-2 py-0.5 font-mono text-xs uppercase tracking-widest text-muted-foreground",
        className,
      )}
    >
      {KIND_LABELS[kind]}
    </span>
  );
}
