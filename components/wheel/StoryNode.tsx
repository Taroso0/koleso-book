import { cn } from "@/lib/utils";
import type { NodeState } from "./ThemeNode";

// Узел-рассказ (§8) — чисто презентационный, в локальном (0,0). Без постоянной
// подписи (34 подписи — каша); заголовок/firstLine показывает превью в WheelCanvas.
// Ступени заливки: холодная пыль → обжитое (прочитан) → тлеет (веер лампы в покое)
// → горит (живое внимание, Шаг 3.4).
export function StoryNode({
  state,
  read = false,
  live = false,
}: {
  state: NodeState;
  read?: boolean; // дочитан до конца — стойкий след памяти «Колеса»
  live?: boolean; // есть живое внимание (hover/фокус) — веер горит в полную силу
}) {
  const lit = state === "active" || state === "highlight";
  return (
    <>
      {/* увеличенная прозрачная зона захвата мыши */}
      <circle r={12} className="fill-transparent" />
      {/* кольцо «обжитого» — только у прочитанного и не горящего: под натрием
          подсветки оно бы всё равно не читалось */}
      {read && !lit && (
        <circle
          r={7.5}
          strokeWidth={1.2}
          className="fill-none stroke-sodium/50"
        />
      )}
      <circle
        r={lit ? (live ? 6 : 4.5) : 4}
        className={cn(
          "transition-all",
          lit
            ? live
              ? "fill-sodium" // внимание — полный огонь
              : "fill-sodium-deep" // покой — пыль лампы тлеет
            : read
              ? "fill-sodium-deep" // обжитый — тёплый
              : "fill-muted-foreground/55", // не прочитан — холодная пыль
        )}
      />
    </>
  );
}
