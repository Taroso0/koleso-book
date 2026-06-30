// Статичный SVG-фолбэк зерна (§4/§11-C2): «материя, а не движение» — видна на ВСЕХ
// уровнях (включая reduced и слабые/тач), не анимируется, поэтому reduced-motion-безопасна.
// Монохромное плёночное зерно (feColorMatrix → grayscale), видимое (~0.13) и при этом мягкое
// (mix-blend overlay) — контраст текста остаётся WCAG AA. pointer-events-none, поверх контента.
export function StaticGrain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 opacity-[0.13] mix-blend-overlay"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0.34 0.34 0.34 0 0 0.34 0.34 0.34 0 0 0.34 0.34 0.34 0 0 0 0 0 0 1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundSize: "160px 160px",
      }}
    />
  );
}
