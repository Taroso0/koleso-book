"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import type { WheelGraph, WheelNode } from "@/lib/graph";
import { reweight } from "@/lib/graph";
import { WHEEL_VIEW, computeWheelLayout, type WheelLayout } from "@/lib/wheelLayout";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { cn } from "@/lib/utils";
import { ThemeNode, type NodeState } from "./ThemeNode";
import { StoryNode } from "./StoryNode";

// Визуальный граф «Колеса» (§5/§8). Базовые позиции — предрасчёт на сборке (проп
// layout). При внимании к рассказу (наведение/клавиатурный фокус) колесо
// перестраивается вокруг него (reweight + плавная анимация); под reduced-motion —
// только подсветка, без reflow. Клавиатура: roving tabindex + стрелки (§11-B1).
export function WheelCanvas({
  graph,
  layout,
}: {
  graph: WheelGraph;
  layout: WheelLayout;
}) {
  const router = useRouter();
  const reduced = useReducedMotionSafe();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [keyboardFocusId, setKeyboardFocusId] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);

  // Порядок обхода клавиатурой: 10 тем (по кольцу), затем 34 рассказа.
  const orderedNodes = useMemo(
    () => [
      ...graph.nodes.filter((n) => n.kind === "theme"),
      ...graph.nodes.filter((n) => n.kind === "story"),
    ],
    [graph],
  );
  const refs = useRef<(SVGGElement | null)[]>([]);

  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const add = (a: string, b: string) =>
      (map.get(a) ?? map.set(a, new Set<string>()).get(a)!).add(b);
    for (const l of graph.links) {
      add(l.source, l.target);
      add(l.target, l.source);
    }
    return map;
  }, [graph]);

  const activeId = keyboardFocusId ?? hoveredId;
  const activeNode = activeId
    ? orderedNodes.find((n) => n.id === activeId) ?? null
    : null;
  const activeStorySlug = activeNode?.kind === "story" ? activeNode.id : null;

  // Перестройка вокруг активного рассказа (клиентский reweight, тёплый старт).
  // Под reduced-motion — базовая укладка (без reflow).
  const displayLayout = useMemo(() => {
    if (reduced || !activeStorySlug) return layout;
    return computeWheelLayout(reweight(graph, activeStorySlug), {
      initial: layout,
      iterations: 80,
      anchor: activeStorySlug, // активный рассказ не двигается — иначе hover «убегает»
    });
  }, [reduced, activeStorySlug, graph, layout]);

  const nodeState = (id: string): NodeState => {
    if (!activeId) return "idle";
    if (id === activeId) return "active";
    return neighbors.get(activeId)?.has(id) ? "highlight" : "dim";
  };
  const linkLit = (s: string, t: string) =>
    !!activeId && (s === activeId || t === activeId);

  const preview = activeNode?.kind === "story" ? activeNode : null;
  const previewPos = preview ? displayLayout[preview.id] : null;

  const themeSide = (id: string): "start" | "end" =>
    (layout[id]?.x ?? 0) >= WHEEL_VIEW.width / 2 ? "start" : "end";

  const activate = (node: WheelNode) => {
    if (node.kind === "story" && node.book) {
      router.push(`/read/${node.book}/${node.id}`);
    }
  };

  const focusAt = (index: number) => {
    const n = orderedNodes.length;
    const ni = ((index % n) + n) % n;
    setFocusIndex(ni);
    refs.current[ni]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusAt(focusIndex + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusAt(focusIndex - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(orderedNodes.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        activate(orderedNodes[focusIndex]);
        break;
    }
  };

  const spring = { type: "spring" as const, stiffness: 120, damping: 22 };
  const reveal = reduced
    ? undefined
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.5, ease: "easeOut" as const },
      };

  return (
    <motion.div
      className="relative"
      role="group"
      aria-label="Граф «Колеса»: темы и рассказы. Навигация — стрелками, Enter открывает рассказ."
      onKeyDown={onKeyDown}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setKeyboardFocusId(null);
        }
      }}
      {...reveal}
    >
      <svg
        viewBox={`0 0 ${WHEEL_VIEW.width} ${WHEEL_VIEW.height}`}
        className="h-auto w-full"
      >
        {/* рёбра */}
        <g>
          {graph.links.map((l, i) => {
            const a = displayLayout[l.source];
            const b = displayLayout[l.target];
            if (!a || !b) return null;
            const lit = linkLit(l.source, l.target);
            return (
              <motion.line
                key={i}
                initial={false}
                animate={{ x1: a.x, y1: a.y, x2: b.x, y2: b.y }}
                transition={spring}
                strokeWidth={lit ? 1.5 : 1}
                className={cn(lit ? "stroke-sodium" : "stroke-foreground")}
                opacity={activeId ? (lit ? 0.9 : 0.08) : 0.2}
              />
            );
          })}
        </g>

        {/* узлы (темы + рассказы) — roving tabindex */}
        {orderedNodes.map((node, i) => {
          const pos = displayLayout[node.id];
          if (!pos) return null;
          const state = nodeState(node.id);
          const focused = keyboardFocusId === node.id;
          return (
            <motion.g
              key={node.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              tabIndex={i === focusIndex ? 0 : -1}
              role={node.kind === "story" ? "link" : "button"}
              aria-label={
                node.kind === "story"
                  ? `Рассказ «${node.label}»`
                  : `Тема «${node.label}»`
              }
              className={cn(
                "cursor-pointer outline-none",
                state === "dim" && "opacity-25",
              )}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setKeyboardFocusId(node.id)}
              onClick={() => activate(node)}
              initial={false}
              animate={{ x: pos.x, y: pos.y }}
              transition={spring}
            >
              {focused && (
                <circle
                  r={node.kind === "theme" ? 15 : 11}
                  strokeWidth={1.5}
                  className="fill-none stroke-sodium"
                />
              )}
              {node.kind === "theme" ? (
                <ThemeNode node={node} state={state} side={themeSide(node.id)} />
              ) : (
                <StoryNode state={state} />
              )}
            </motion.g>
          );
        })}
      </svg>

      {/* превью firstLine у активного рассказа */}
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
