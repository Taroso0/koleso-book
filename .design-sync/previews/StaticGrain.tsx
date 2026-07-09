// Авторская превью StaticGrain — фиксированный полноэкранный слой плёночного зерна
// (SVG feTurbulence, mix-blend: overlay). Это «фактура» офисной готики: она лежит
// поверх ВСЕЙ сцены, поэтому ячейка одна — два слоя зерна сложились бы по непрозрачности.
// Под зерном — настоящая поверхность (бумага + сериф), иначе показывать нечего.
import { StaticGrain } from "kirilov";

export const OverPaper = () => (
  <div
    style={{
      minHeight: "100svh",
      display: "grid",
      placeContent: "center",
      padding: 48,
      background: "var(--paper)",
      color: "var(--foreground)",
    }}
  >
    <div style={{ maxWidth: "34rem" }}>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-mono-accent)",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: "var(--muted-foreground)",
        }}
      >
        фактура · зерно
      </p>
      <p
        style={{
          margin: "18px 0 0",
          fontFamily: "var(--font-prose)",
          fontSize: 28,
          lineHeight: 1.35,
          letterSpacing: "-0.01em",
          textWrap: "balance",
        }}
      >
        Бумага никогда не бывает чистой. На ней всегда лежит немного ночи —
        ровно столько, чтобы это заметили боковым зрением.
      </p>
    </div>
    <StaticGrain />
  </div>
);
