import type { WheelNode } from "@/lib/graph";
import { cn } from "@/lib/utils";
import type { NodeState } from "./ThemeNode";

// Узел-рассказ (§8): кружок без постоянной подписи (34 подписи — каша); заголовок и
// firstLine показываются превью-карточкой при наведении (управляет WheelCanvas).
export function StoryNode({
  node,
  x,
  y,
  state,
  onHover,
  onSelect,
}: {
  node: WheelNode;
  x: number;
  y: number;
  state: NodeState;
  onHover: (id: string | null) => void;
  onSelect: (node: WheelNode) => void;
}) {
  const lit = state === "active" || state === "highlight";
  return (
    <g
      className={cn(
        "cursor-pointer transition-opacity duration-200",
        state === "dim" && "opacity-25",
      )}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(node)}
    >
      {/* увеличенная прозрачная зона захвата мыши */}
      <circle cx={x} cy={y} r={12} className="fill-transparent" />
      <circle
        cx={x}
        cy={y}
        r={lit ? 7 : 5}
        className={cn("transition-all", lit ? "fill-sodium" : "fill-muted-foreground")}
      />
    </g>
  );
}
