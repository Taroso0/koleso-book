// Авторская превью GlitchText — haunted-примитив «системного регистра»: короткий
// «разряд» (натриевый и холодный клоны разъезжаются и гаснут). На статичном превью
// play={false} → чистый, легибельный текст (детерминированно); анимация-разряд
// проявляется в живом дизайне. Композиция — «свечение монитора» (офисная готика).
import { GlitchText } from "kirilov";

export const SystemRegister = () => (
  <div
    style={{
      padding: 40,
      background: "var(--background)",
      color: "var(--foreground)",
      fontFamily: "var(--font-system)",
    }}
  >
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "36px 40px",
        background: "var(--monitor, oklch(0.18 0.02 250))",
        color: "var(--paper, oklch(0.92 0.01 95))",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono-accent)",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          opacity: 0.6,
        }}
      >
        система · регистр
      </div>
      <h2
        style={{
          margin: "14px 0 0",
          fontFamily: "var(--font-system)",
          fontSize: 38,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          lineHeight: 1.1,
        }}
      >
        <GlitchText text="ОДЕРЖИМЫЙ ИНТЕРФЕЙС" play={false} />
      </h2>
      <p
        style={{
          margin: "16px 0 0",
          fontFamily: "var(--font-prose)",
          fontSize: 16,
          lineHeight: 1.6,
          opacity: 0.75,
        }}
      >
        Заголовок «материализуется» одним коротким разрядом и остаётся чистым —
        чудо видно боковым зрением.
      </p>
      <div
        style={{
          marginTop: 24,
          height: 2,
          width: 64,
          background: "var(--sodium)",
        }}
      />
    </div>
  </div>
);
