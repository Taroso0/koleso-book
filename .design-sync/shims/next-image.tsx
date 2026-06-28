import type { CSSProperties } from "react";

// Шим для design-бандла: next/image → нативный <img>. Размеры/alt берём как есть
// (вёрстка достоверна, без CLS); next-специфичную оптимизацию (loader/srcset/
// priority/placeholder) отбрасываем — она требует Next-рантайма и нерелевантна
// статичному превью. aria-*/data-*/style/sizes/className сохраняем.
type ImageProps = {
  src: string | { src: string };
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
};

const NEXT_ONLY = new Set([
  "priority",
  "loader",
  "quality",
  "placeholder",
  "blurDataURL",
  "fill",
  "unoptimized",
  "onLoadingComplete",
]);

export default function Image({ src, alt = "", ...rest }: ImageProps) {
  const s = typeof src === "string" ? src : (src?.src ?? "");
  const clean: Record<string, unknown> = {};
  for (const k in rest) if (!NEXT_ONLY.has(k)) clean[k] = rest[k];
  return <img src={s} alt={alt} {...clean} />;
}
