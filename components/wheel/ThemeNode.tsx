import type { WheelNode } from "@/lib/graph";
import { cn } from "@/lib/utils";

export type NodeState = "idle" | "active" | "highlight" | "dim";

// Узел-понятие (§8): кружок на «ободе» + подпись наружу кольца. Состояния — пропсом.
export function ThemeNode({
  node,
  x,
  y,
  cx,
  state,
}: {
  node: WheelNode;
  x: number;
  y: number;
  cx: number; // центр по X — чтобы подпись уходила наружу кольца
  state: NodeState;
}) {
  const lit = state === "active" || state === "highlight";
  const onRight = x >= cx;
  return (
    <g className={cn("transition-opacity duration-200", state === "dim" && "opacity-30")}>
      <circle
        cx={x}
        cy={y}
        r={10}
        strokeWidth={2}
        className={cn(
          lit ? "fill-sodium stroke-sodium" : "fill-background stroke-foreground",
        )}
      />
      <text
        x={x + (onRight ? 16 : -16)}
        y={y}
        dy="0.32em"
        textAnchor={onRight ? "start" : "end"}
        className={cn(
          "font-sans text-[15px]",
          lit ? "fill-foreground font-medium" : "fill-muted-foreground",
        )}
      >
        {node.label}
      </text>
    </g>
  );
}
