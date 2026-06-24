import type { ReactNode } from "react";
import { applyTypograf } from "@/lib/typograf";

// Курсив *…* только с markdown-подобными границами: открывающая «*» — в начале или
// после пробела/скобки/кавычки, закрывающая — в конце или перед пробелом/пунктуацией.
// Так непарные звёздочки (маркеры сносок «Айон*», самоцензура «Бл*») остаются литералом
// и не «сдвигают» курсив на соседний фрагмент. Сноски как фича — отдельный вопрос.
const EMPHASIS = /(?<=^|[\s(«„])\*(\S(?:[^*\n]*\S)?)\*(?=$|[\s.,!?:;)»"…—-])/gu;

/** Инлайн-рендер курсива (best-effort; финальная вычитка — за человеком). */
function renderInline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(EMPHASIS)) {
    const start = m.index;
    if (start > last) nodes.push(text.slice(last, start));
    nodes.push(<em key={key++}>{m[1]}</em>);
    last = start + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// Тело рассказа: простые абзацы (разделены пустой строкой); «***» — разделитель сцен.
// typograf применяется на сборке (SSG), а не в рантайме.
export function ProseBody({ body }: { body: string }) {
  const blocks = body
    .trim()
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {blocks.map((block, i) =>
        block === "***" ? (
          <p
            key={i}
            aria-hidden
            className="select-none py-2 text-center text-2xl text-muted-foreground"
          >
            * * *
          </p>
        ) : (
          <p key={i}>{renderInline(applyTypograf(block))}</p>
        ),
      )}
    </div>
  );
}
