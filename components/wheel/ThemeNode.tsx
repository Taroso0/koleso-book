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
  readFraction = 0,
}: {
  node: WheelNode;
  state: NodeState;
  side: "start" | "end"; // сторона подписи (наружу кольца)
  radius: number; // ∝ степени темы — считает WheelCanvas (одна формула, одно место)
  degree: number; // число рассказов на теме
  breathe: boolean; // node.id === litId && !reduced — дышит только горящее понятие
  readFraction?: number; // [0..1] доля прочитанных рассказов темы — «тепло» (§8)
}) {
  const lit = state === "active" || state === "highlight";
  // подпись отодвигается наружу от кольца (радиус переменный)
  const dx = side === "start" ? radius + 8 : -(radius + 8);
  // кегль подписи растёт со степенью — счётчик опускаем пропорционально ему, чтобы
  // десцендеры («у», «Д») не легли на «· N» у крупных тем (§ фикс ①).
  const labelSize = Math.min(19, 11.5 + degree * 0.45);
  // дуга прогресса чтения темы: между кольцом (r) и ореолом (r+7)
  const arcRadius = radius + 3.5;
  const arcCircumference = 2 * Math.PI * arcRadius;
  return (
    <>
      {/* ореол присутствия — только когда горит (созвездие, не лаборатория) */}
      {lit && <circle r={radius + 7} className="fill-sodium/10" />}
      {/* тема копит тепло: дуга ∝ доле прочитанных её рассказов, старт сверху.
          Живёт вне дышащего кольца, поэтому не масштабируется вместе с ним. */}
      {readFraction > 0 && (
        <circle
          r={arcRadius}
          transform="rotate(-90)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={`${readFraction * arcCircumference} ${arcCircumference}`}
          className="fill-none stroke-sodium/55"
        />
      )}
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
      {/* смысл — антиквой (§5 «душа»); кегль растёт со степенью.
          У «начатой» темы подпись теплеет — тёплый сдвиг к натрию (§8). */}
      <text
        x={dx}
        dy="0.30em"
        textAnchor={side}
        className={cn(
          "font-serif",
          lit
            ? "fill-foreground font-semibold"
            : readFraction > 0
              ? "wheel-label-warm"
              : "fill-muted-foreground",
        )}
        style={{ fontSize: labelSize }}
      >
        {node.label}
      </text>
      {/* метаданные (счётчик рассказов) — моноширинным (§5 «система») */}
      <text
        x={dx}
        y={12 + labelSize * 0.5}
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
