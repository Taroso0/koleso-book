import type { WheelNode } from "@/lib/graph";
import { cn } from "@/lib/utils";

export type NodeState = "idle" | "active" | "highlight" | "dim";

// Узел-понятие (§8) — чисто презентационный, рисуется в локальном (0,0).
// Позицию, анимацию и интерактив даёт родительский <g> в WheelCanvas.
export function ThemeNode({
  node,
  state,
  side,
  radius,
  degree,
  breathe,
}: {
  node: WheelNode;
  state: NodeState;
  side: "start" | "end"; // сторона подписи (наружу кольца)
  radius: number; // ∝ степени темы — считает WheelCanvas (одна формула, одно место)
  degree: number; // число рассказов на теме
  breathe: boolean; // node.id === litId && !reduced — дышит только горящее понятие
}) {
  const lit = state === "active" || state === "highlight";
  // подпись отодвигается наружу от кольца (радиус переменный)
  const dx = side === "start" ? radius + 8 : -(radius + 8);
  return (
    <>
      {/* ореол присутствия — только когда горит (созвездие, не лаборатория) */}
      {lit && <circle r={radius + 7} className="fill-sodium/10" />}
      {/* кольцо: дышит ТОЛЬКО оно — класс на самом <circle>, не на позиционном
          <motion.g> (иначе Motion-inline transform перебьёт CSS-scale) */}
      <circle
        r={radius}
        strokeWidth={2}
        className={cn(
          lit ? "fill-sodium stroke-sodium" : "fill-background stroke-foreground",
          breathe && "wheel-breathe",
        )}
      />
      {/* смысл — антиквой (§5 «душа»); кегль растёт со степенью */}
      <text
        x={dx}
        dy="0.30em"
        textAnchor={side}
        className={cn(
          "font-serif",
          lit ? "fill-foreground font-semibold" : "fill-muted-foreground",
        )}
        style={{ fontSize: Math.min(19, 11.5 + degree * 0.45) }}
      >
        {node.label}
      </text>
      {/* метаданные (счётчик рассказов) — моноширинным (§5 «система») */}
      <text
        x={dx}
        y={14}
        textAnchor={side}
        className={cn(
          "font-mono text-[8.5px]",
          lit ? "fill-sodium" : "fill-muted-foreground/70",
        )}
      >
        · {degree}
      </text>
    </>
  );
}
