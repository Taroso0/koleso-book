"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import type { WheelGraph, WheelNode } from "@/lib/graph";
import { WHEEL_VIEW, type WheelLayout } from "@/lib/wheelLayout";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { cn } from "@/lib/utils";
import { ThemeNode, type NodeState } from "./ThemeNode";
import { StoryNode } from "./StoryNode";

// Визуальный граф «Колеса» (§5/§8). Позиции — предрасчёт на сборке (проп layout),
// здесь только рисование SVG + наведение/клик. Доступность делегирована индексу:
// контейнер aria-hidden (§8/§11-B1). На мобильном не монтируется (см. WheelGraph).
export function WheelCanvas({
  graph,
  layout,
  activeStoryId,
}: {
  graph: WheelGraph;
  layout: WheelLayout;
  activeStoryId?: string;
}) {
  const router = useRouter();
  const reduced = useReducedMotionSafe();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const focusId = hoveredId ?? activeStoryId ?? null;

  // Смежность для подсветки (узел ↔ соседи).
  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const add = (a: string, b: string) => {
      (map.get(a) ?? map.set(a, new Set()).get(a)!).add(b);
    };
    for (const l of graph.links) {
      add(l.source, l.target);
      add(l.target, l.source);
    }
    return map;
  }, [graph]);

  const nodeState = (id: string): NodeState => {
    if (!focusId) return "idle";
    if (id === focusId) return "active";
    return neighbors.get(focusId)?.has(id) ? "highlight" : "dim";
  };
  const linkLit = (s: string, t: string) =>
    !!focusId && (s === focusId || t === focusId);

  const themeNodes = graph.nodes.filter((n) => n.kind === "theme");
  const storyNodes = graph.nodes.filter((n) => n.kind === "story");

  const hovered = hoveredId
    ? graph.nodes.find((n) => n.id === hoveredId)
    : null;
  const preview = hovered?.kind === "story" ? hovered : null;
  const previewPos = preview ? layout[preview.id] : null;

  const onSelect = (node: WheelNode) => {
    if (node.kind === "story" && node.book) {
      router.push(`/read/${node.book}/${node.id}`);
    }
  };

  const reveal = reduced
    ? undefined
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.5, ease: "easeOut" as const },
      };

  return (
    <motion.div className="relative" aria-hidden="true" {...reveal}>
      <svg
        viewBox={`0 0 ${WHEEL_VIEW.width} ${WHEEL_VIEW.height}`}
        role="img"
        className="h-auto w-full"
      >
        {/* рёбра */}
        <g>
          {graph.links.map((l, i) => {
            const a = layout[l.source];
            const b = layout[l.target];
            if (!a || !b) return null;
            const lit = linkLit(l.source, l.target);
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                strokeWidth={lit ? 1.5 : 1}
                className={cn(lit ? "stroke-sodium" : "stroke-border")}
                opacity={focusId ? (lit ? 0.9 : 0.12) : 0.4}
              />
            );
          })}
        </g>

        {/* темы */}
        <g>
          {themeNodes.map((n) => {
            const p = layout[n.id];
            if (!p) return null;
            return (
              <ThemeNode
                key={n.id}
                node={n}
                x={p.x}
                y={p.y}
                cx={WHEEL_VIEW.width / 2}
                state={nodeState(n.id)}
              />
            );
          })}
        </g>

        {/* рассказы */}
        <g>
          {storyNodes.map((n) => {
            const p = layout[n.id];
            if (!p) return null;
            return (
              <StoryNode
                key={n.id}
                node={n}
                x={p.x}
                y={p.y}
                state={nodeState(n.id)}
                onHover={setHoveredId}
                onSelect={onSelect}
              />
            );
          })}
        </g>
      </svg>

      {/* превью firstLine у узла-рассказа */}
      {preview && previewPos && (
        <div
          className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 -translate-y-full rounded-sm border border-border bg-card p-3 shadow-sm"
          style={{
            left: `${(previewPos.x / WHEEL_VIEW.width) * 100}%`,
            top: `${(previewPos.y / WHEEL_VIEW.height) * 100}%`,
            marginTop: -14,
          }}
        >
          <p className="font-sans text-sm font-medium">{preview.label}</p>
          {preview.firstLine && (
            <p className="mt-1 line-clamp-3 font-serif text-xs leading-snug text-muted-foreground">
              {preview.firstLine}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
