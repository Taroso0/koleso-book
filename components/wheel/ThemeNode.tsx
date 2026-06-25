import type { WheelNode } from "@/lib/graph";
import { cn } from "@/lib/utils";

export type NodeState = "idle" | "active" | "highlight" | "dim";

// Узел-понятие (§8) — чисто презентационный, рисуется в локальном (0,0).
// Позицию, анимацию и интерактив даёт родительский <g> в WheelCanvas.
export function ThemeNode({
  node,
  state,
  side,
}: {
  node: WheelNode;
  state: NodeState;
  side: "start" | "end"; // сторона подписи (наружу кольца)
}) {
  const lit = state === "active" || state === "highlight";
  return (
    <>
      <circle
        r={10}
        strokeWidth={2}
        className={cn(
          lit ? "fill-sodium stroke-sodium" : "fill-background stroke-foreground",
        )}
      />
      <text
        x={side === "start" ? 16 : -16}
        dy="0.32em"
        textAnchor={side}
        className={cn(
          "font-sans text-[15px]",
          lit ? "fill-foreground font-medium" : "fill-muted-foreground",
        )}
      >
        {node.label}
      </text>
    </>
  );
}
