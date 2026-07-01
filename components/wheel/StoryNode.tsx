import { cn } from "@/lib/utils";
import type { NodeState } from "./ThemeNode";

// Узел-рассказ (§8) — чисто презентационный, в локальном (0,0). Без постоянной
// подписи (34 подписи — каша); заголовок/firstLine показывает превью в WheelCanvas.
export function StoryNode({ state }: { state: NodeState }) {
  const lit = state === "active" || state === "highlight";
  return (
    <>
      {/* увеличенная прозрачная зона захвата мыши */}
      <circle r={12} className="fill-transparent" />
      <circle
        r={lit ? 5 : 3}
        className={cn(
          "transition-all",
          lit ? "fill-sodium" : "fill-muted-foreground/55",
        )}
      />
    </>
  );
}
