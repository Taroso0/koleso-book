"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import type { WheelGraph, WheelNode } from "@/lib/graph";
import {
  readFractionByTheme,
  reweight,
  reweightRead,
  themeDegree,
} from "@/lib/graph";
import { WHEEL_VIEW, computeWheelLayout, type WheelLayout } from "@/lib/wheelLayout";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { useZachin } from "@/components/haunted/zachinContext";
import { cn } from "@/lib/utils";
import { ThemeNode, type NodeState } from "./ThemeNode";
import { StoryNode } from "./StoryNode";
import { AnchorPlate } from "./AnchorPlate";
import { useReadStories } from "./readStories";
import { resolvedWheelAnchors } from "@/lib/anchors";

// Задержка «подержать» перед подсветкой узла — чтобы случайные пролёты мыши над
// кругами при небыстром движении не захватывали их.
const HOVER_DWELL_MS = 200;

// Ротация покоя (Шаг 6): в покое Колесо медленно перещёлкивает горящую тему по
// каноническому кругу (themes.ts) — «каждый оборот встречает другим понятием».
// Смена только defaultLit (litId), укладку не трогает → без reflow; вся плавность —
// CSS-кроссфейд 1.2–1.4s на рёбрах/кольцах/подписях (globals.css). Живое внимание
// (hover/фокус) убивает таймер; рестарт — после 12 с тишины. Под reduced — выкл.
const ROTOR_PERIOD_MS = 15_000;
const ROTOR_RESTART_MS = 12_000;

// Радиус узла-темы: ПЛОЩАДЬ ∝ степени — √-шкала, честные «чернила» (Шаг 3.4).
// Линейный кламп схлопывал вершину («Человек» 22 и «Душа» 17 выходили почти равными);
// √ разводит её (20.2 против 17.7), а пол 5.5 держит тему с 0 рёбер видимой.
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const radiusForDegree = (degree: number) => clamp(4.3 * Math.sqrt(degree), 5.5, 23);

// Визуальный граф «Колеса» (§5/§8). Базовые позиции — предрасчёт на сборке (проп
// layout). Два слоя перестройки: СТОЙКИЙ — память о прочитанном (reweightRead,
// переживает перезагрузку) и ЖИВОЙ — внимание к узлу под курсором/фокусом (reweight,
// поверх памяти). Под reduced-motion reflow нет, но след памяти рисуется — паритет,
// а не «выключено». Клавиатура: roving tabindex + стрелки (§11-B1).
export function WheelCanvas({
  graph,
  layout,
}: {
  graph: WheelGraph;
  layout: WheelLayout;
}) {
  const router = useRouter();
  const zachin = useZachin();
  const reduced = useReducedMotionSafe();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [keyboardFocusId, setKeyboardFocusId] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Вес понятий из графа (build-time): степень = число рассказов на теме.
  const degree = useMemo(() => themeDegree(graph), [graph]);
  const radiusOf = (id: string) => radiusForDegree(degree[id] ?? 0);

  // Память: что прочитано в «Читальне» (localStorage, пост-маунт). «Колесо» только
  // читает этот store — наполняет его Читальня.
  const readSet = useReadStories(graph);
  const readFraction = useMemo(
    () => readFractionByTheme(graph, readSet),
    [graph, readSet],
  );

  // «Горит по умолчанию» — тема с макс. степенью (тай-брейк: канонический порядок).
  // Вычисляется из данных → после вычитки themes[] картинка пересоберётся сама.
  const defaultLitId = useMemo(() => {
    const themeNodes = graph.nodes.filter((n) => n.kind === "theme");
    return (
      themeNodes
        .map((n, i) => ({ id: n.id, deg: degree[n.id] ?? 0, i }))
        .sort((a, b) => b.deg - a.deg || a.i - b.i)[0]?.id ?? null
    );
  }, [graph, degree]);

  // Канонический круг тем (порядок themes.ts) — по нему идёт ротация покоя.
  const themeOrderIds = useMemo(
    () => graph.nodes.filter((n) => n.kind === "theme").map((n) => n.id),
    [graph],
  );

  // Кто «горит» в покое: старт — тема макс. степени (defaultLit, детерминирован на
  // сервере → первый кадр совпадает, без hydration-mismatch), дальше ротор ведёт по
  // кругу. Таймер стартует post-mount (useEffect) — на SSR ротации нет.
  const [restLitId, setRestLitId] = useState<string | null>(defaultLitId);

  const activeId = keyboardFocusId ?? hoveredId;
  const activeNode = activeId
    ? orderedNodes.find((n) => n.id === activeId) ?? null
    : null;
  const activeStorySlug = activeNode?.kind === "story" ? activeNode.id : null;

  // Покой больше не пустой: без внимания горит restLitId (ротор ведёт его по кругу от
  // defaultLit); внимание переносит огонь. litId ведёт натрий (кто горит); «сильный
  // дим» остаётся на activeId (живое внимание).
  const litId = activeId ?? restLitId;

  // Покой против внимания (Шаг 3.4): в покое горящая тема — лампа, не прожектор.
  // Веер litId тлеет (рёбра 0.4, пыль sodium-deep); полный огонь — только под живым
  // вниманием (hover/фокус). Кольцо/подпись/счётчик лампы не приглушаются.
  const live = activeId != null;

  // Граф с усиленными рёбрами прочитанного — общая основа обоих слоёв укладки.
  const memoryGraph = useMemo(
    () => reweightRead(graph, readSet),
    [graph, readSet],
  );

  // Память «Колеса»: начатые темы наклоняются внутрь кольца ∝ доле прочитанного, их
  // рассказы садятся ближе — карта оседает вокруг пройденного пути (§8). Пересчёт
  // только при смене множества. Под reduced-motion reflow нет: позиции = build-time,
  // но след/тепло/дуги рисуются (паритет — статичный сценарий, а не «выключено»).
  const memoryLayout = useMemo(() => {
    if (reduced || readSet.size === 0) return layout;
    return computeWheelLayout(memoryGraph, {
      initial: layout,
      iterations: 200, // разовый пересчёт от тёплого старта: 44 узла, единицы мс
      lean: readFraction,
    });
  }, [reduced, readSet, memoryGraph, layout, readFraction]);

  // Живое внимание к рассказу — временный reweight ПОВЕРХ памяти (веса композируются,
  // иначе на hover память «отпускалась» бы). Тёплый старт — от укладки памяти; тот же
  // lean, иначе наклонённые темы прыгали бы обратно на кольцо при наведении.
  // displayLayout НЕ мемоизируем вручную — отдаём React Compiler (включён в
  // next.config). Ручной useMemo здесь он сохранить не может: computeWheelLayout
  // «мутирует» результат reweight(...), а компилятор консервативно считает, что
  // тот алиасит аргументы reweight, — область их зависимостей растягивается через
  // границу useMemo. Плоский const такой границы не создаёт: компилятор мемоизирует
  // его сам по тем же реактивным входам. «Граф внимания» строим от исходного графа
  // (проп заморожен) + readSet, а НЕ от memoized memoryGraph, — тогда memoryGraph и
  // дорогая укладка памяти memoryLayout (200 итераций) остаются в своих областях и
  // НЕ пересчитываются на hover. Значение идентично reweight(memoryGraph, …):
  // reweightRead чист и детерминирован.
  const displayLayout =
    reduced || !activeStorySlug
      ? memoryLayout
      : computeWheelLayout(
          reweight(reweightRead(graph, readSet), activeStorySlug),
          {
            initial: memoryLayout,
            iterations: 80,
            anchor: activeStorySlug, // активный рассказ не двигается — иначе hover «убегает»
            lean: readFraction,
          },
        );

  // Снять висящий таймер наведения при размонтировании.
  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    },
    [],
  );

  // ── Ротация покоя ──────────────────────────────────────────────────────────
  // Рекурсивный таймер: перещёлкивает restLitId на следующую тему круга и сам себя
  // перепланирует на период. Под reduced-motion не заводится (statичный «Максимум»).
  const rotorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotorStarted = useRef(false);
  const scheduleRotor = useCallback(
    (delay: number) => {
      if (rotorTimer.current) clearTimeout(rotorTimer.current);
      if (reduced || themeOrderIds.length === 0) return;
      // локальный шаг рекурсивно перепланирует себя на период — рекурсия живёт вне
      // useCallback (react-compiler запрещает мемо-значению ссылаться на себя)
      const step = () => {
        setRestLitId((cur) => {
          const i = cur ? themeOrderIds.indexOf(cur) : -1;
          return themeOrderIds[(i + 1) % themeOrderIds.length];
        });
        rotorTimer.current = setTimeout(step, ROTOR_PERIOD_MS);
      };
      rotorTimer.current = setTimeout(step, delay);
    },
    [reduced, themeOrderIds],
  );

  // Внимание (hover/фокус) ставит ротор на паузу; уход — рестарт после 12 с тишины.
  // Первый запуск (post-mount) — через полный период (15 с), чтобы Колесо встретило
  // спокойным «Максимумом», а не дёрнулось сразу.
  useEffect(() => {
    if (activeId != null) {
      if (rotorTimer.current) {
        clearTimeout(rotorTimer.current);
        rotorTimer.current = null;
      }
    } else {
      scheduleRotor(rotorStarted.current ? ROTOR_RESTART_MS : ROTOR_PERIOD_MS);
      rotorStarted.current = true;
    }
    return () => {
      if (rotorTimer.current) clearTimeout(rotorTimer.current);
    };
  }, [activeId, scheduleRotor]);

  // Состояние (натрий) — от litId (в покое = defaultLit), не от activeId.
  const nodeState = (id: string): NodeState => {
    if (!litId) return "idle";
    if (id === litId) return "active";
    return neighbors.get(litId)?.has(id) ? "highlight" : "dim";
  };
  const linkLit = (s: string, t: string) =>
    !!litId && (s === litId || t === litId);

  // Превью рассказа (заголовок + firstLine) расцеплено с подсветкой: при наведении
  // на рассказ показываем его карточку. Если активна ТЕМА (закреплена кликом/
  // фокусом), карточку даём только для ЕЁ подсвеченных (соседних) рассказов, а не
  // для приглушённых; так на колесе видно, что это за рассказ под темой.
  const hoveredNode = hoveredId
    ? orderedNodes.find((n) => n.id === hoveredId) ?? null
    : null;
  const hoveredStory = hoveredNode?.kind === "story" ? hoveredNode : null;
  const themeActive = activeNode?.kind === "theme" ? activeNode : null;
  let previewNode: WheelNode | null = null;
  if (hoveredStory) {
    // при активной теме — только её подсвеченный рассказ
    previewNode =
      themeActive && !neighbors.get(themeActive.id)?.has(hoveredStory.id)
        ? null
        : hoveredStory;
  } else if (activeNode?.kind === "story") {
    previewNode = activeNode; // клавиатурный фокус на рассказе
  }
  const previewPos = previewNode ? displayLayout[previewNode.id] : null;

  const themeSide = (id: string): "start" | "end" =>
    (layout[id]?.x ?? 0) >= WHEEL_VIEW.width / 2 ? "start" : "end";

  // Активация рассказа: «первая строка как событие» (зачин) → переход в Читальню.
  // Фолбэк на прямой переход, если провайдера зачина нет (граф вне «Витрины»).
  const activate = (node: WheelNode) => {
    if (node.kind !== "story" || !node.book) return;
    if (zachin) {
      zachin.playOpening({
        firstLine: node.firstLine ?? node.label,
        slug: node.id,
        book: node.book,
        title: node.label,
      });
    } else {
      router.push(`/read/${node.book}/${node.id}`);
    }
  };

  // Наведение с задержкой: подсветка только если мышь «подержали» на узле.
  const onNodeEnter = (id: string) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoveredId(id), HOVER_DWELL_MS);
  };
  const onNodeLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setHoveredId(null);
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
        // «живое внимание» → CSS ускоряет кроссфейд рёбер/колец/подписей до .3s;
        // в покое (ротация) переходы медленные (1.2–1.4s), «лампа, а не вспышка».
        data-live={live ? "true" : "false"}
      >
        {/* рёбра: холод → след прочитанного → тление (покой) → огонь (внимание).
            Тление 0.4 и след 0.34 близки намеренно: покой выглядит «обжитым»,
            но горящий путь чуть теплее следа. */}
        <g>
          {graph.links.map((l, i) => {
            const a = displayLayout[l.source];
            const b = displayLayout[l.target];
            if (!a || !b) return null;
            const lit = linkLit(l.source, l.target);
            const trace = !lit && readSet.has(l.source);
            return (
              <motion.line
                key={i}
                initial={false}
                animate={{ x1: a.x, y1: a.y, x2: b.x, y2: b.y }}
                transition={spring}
                strokeWidth={lit ? (live ? 1.5 : 1.1) : 1}
                className={cn(
                  "wheel-link",
                  lit || trace ? "stroke-sodium" : "stroke-foreground",
                )}
                opacity={lit ? (live ? 0.9 : 0.4) : trace ? 0.34 : 0.11}
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
                // сильный дим — ТОЛЬКО при живом внимании (hover/фокус), не в покое:
                // иначе всё неподсвеченное ушло бы в 25% и колесо стало бы призрачным
                activeId && state === "dim" && "opacity-25",
                // при выбранной теме приглушённые рассказы некликабельны вовсе
                themeActive &&
                  node.kind === "story" &&
                  state === "dim" &&
                  "pointer-events-none",
              )}
              onMouseEnter={() => onNodeEnter(node.id)}
              onMouseLeave={onNodeLeave}
              onFocus={() => setKeyboardFocusId(node.id)}
              onClick={() => activate(node)}
              initial={false}
              animate={{ x: pos.x, y: pos.y }}
              transition={spring}
            >
              {focused && (
                // Контрастное кольцо фокуса (WCAG 2.4.11): --foreground даёт ≥3:1 на
                // светлом фоне (натриевое давало ~2:1). Бренд-цвет несёт сам узел
                // (активный узел заливается sodium).
                <circle
                  r={node.kind === "theme" ? radiusOf(node.id) + 6 : 12}
                  strokeWidth={2}
                  className="fill-none stroke-foreground"
                />
              )}
              {node.kind === "theme" ? (
                <ThemeNode
                  node={node}
                  state={state}
                  side={themeSide(node.id)}
                  radius={radiusOf(node.id)}
                  degree={degree[node.id] ?? 0}
                  breathe={node.id === litId && !reduced}
                  readFraction={readFraction[node.id] ?? 0}
                />
              ) : (
                <StoryNode
                  state={state}
                  read={readSet.has(node.id)}
                  live={live}
                />
              )}
            </motion.g>
          );
        })}
      </svg>

      {/* Слой якорей-иллюстраций (§8, §14): декоративные плашки у 2–3 узлов-тем —
          карта смыслов получает «плоть». Живёт ВНУТРИ WheelCanvas (а не отдельным
          сиблингом): красится теми же состояниями, что и узлы (nodeState/activeId/live),
          позиционируется процентами поверх SVG — как карточка-превью ниже. Не трогает
          укладку/вес/память/клавиатуру; pointer-events:none → hit-зона у узла. */}
      {resolvedWheelAnchors.map((t) => {
        const p = displayLayout[t.theme];
        const node = graph.nodes.find(
          (n) => n.id === t.theme && n.kind === "theme",
        );
        if (!p || !node) return null;
        const deg = degree[t.theme] ?? 0;
        const r = radiusOf(t.theme);
        // кегль подписи — та же формула, что в ThemeNode (√-шкала)
        const size = Math.min(19.5, 8.5 + 2.3 * Math.sqrt(deg));
        // ширину подписи меряет прототип через getBBox; на рендере его нет — оцениваем
        // по формуле движка (Шаг 6): lblLen·fs·0.56 + 26 (запас на счётчик/кернинг)
        const labelW = node.label.length * size * 0.56 + 26;
        // снаружи кольца, за концом подписи, с равным воздухом (движок: r+9+lw+30);
        // ВЕРТИКАЛЬНО ПО ЦЕНТРУ УЗЛА — без радиального сдвига (он уводил плашку к
        // соседям: «Иллюзию» к «Выбору», «Смерть» вправо, скрин ревью Шаг 6).
        const away = r + 9 + labelW + 30;
        const ox = themeSide(t.theme) === "start" ? away : -away;
        const fx = p.x + ox + (t.nudge?.x ?? 0);
        const fy = p.y + (t.nudge?.y ?? 0);
        const state = nodeState(t.theme);
        const lit = state === "active" || state === "highlight"; // как ThemeNode
        const dimmed = activeId != null && state === "dim"; // как opacity-25 узла
        return (
          <AnchorPlate
            key={t.theme}
            src={t.src}
            width={t.width}
            height={t.height}
            left={`${(fx / WHEEL_VIEW.width) * 100}%`}
            top={`${(fy / WHEEL_VIEW.height) * 100}%`}
            lit={lit}
            dimmed={dimmed}
            lift={lit && live && !reduced} // подъём только под живым вниманием
          />
        );
      })}

      {/* превью наведённого рассказа: заголовок + firstLine */}
      {previewNode && previewPos && (
        <div
          className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 -translate-y-full rounded-sm border border-border bg-card p-3 shadow-sm"
          style={{
            left: `${(previewPos.x / WHEEL_VIEW.width) * 100}%`,
            top: `${(previewPos.y / WHEEL_VIEW.height) * 100}%`,
            marginTop: -14,
          }}
        >
          <p className="font-sans text-sm font-medium text-card-foreground">
            {previewNode.label}
          </p>
          {previewNode.firstLine && (
            <p className="mt-1 line-clamp-3 font-serif text-xs leading-snug text-muted-foreground">
              {previewNode.firstLine}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
