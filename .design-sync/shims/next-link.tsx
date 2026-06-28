import type { ReactNode } from "react";

// Шим для design-бандла: next/link → нативный <a>. Реальный Link тоже рендерит <a>;
// App-Router-контекст ему нужен лишь для prefetch/клиентской навигации, что
// нерелевантно статичному превью. Next-специфичные пропы отбрасываем, чтобы React
// не предупреждал о неизвестных DOM-атрибутах. href в нашем коде всегда строка.
type LinkProps = {
  href: string | { pathname?: string };
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
};

const NEXT_ONLY = new Set([
  "prefetch",
  "replace",
  "scroll",
  "shallow",
  "passHref",
  "legacyBehavior",
  "locale",
  "as",
]);

export default function Link({ href, children, ...rest }: LinkProps) {
  const clean: Record<string, unknown> = {};
  for (const k in rest) if (!NEXT_ONLY.has(k)) clean[k] = rest[k];
  const h = typeof href === "string" ? href : (href?.pathname ?? "#");
  return (
    <a href={h} {...clean}>
      {children}
    </a>
  );
}
