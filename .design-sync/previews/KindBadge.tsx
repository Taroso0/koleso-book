// Авторская превью KindBadge — mono-чип вида записи «Мастерской» («система» из
// дуальной типографики). Импорт из пакета шимится на window.Kirilov.KindBadge.
import { KindBadge } from "kirilov";

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      padding: 32,
      background: "var(--background)",
      color: "var(--foreground)",
      fontFamily: "var(--font-system)",
    }}
  >
    {children}
  </div>
);

const muted: React.CSSProperties = {
  fontFamily: "var(--font-prose)",
  color: "var(--muted-foreground)",
  fontSize: 15,
};

// Все четыре вида с короткой расшифровкой — единый словарь меток ленты.
export const Vocabulary = () => (
  <Frame>
    <div style={{ display: "grid", gap: 16, maxWidth: 440 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <KindBadge kind="fragment" />
        <span style={muted}>отрывок будущей главы</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <KindBadge kind="draft" />
        <span style={muted}>черновик, ещё в работе</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <KindBadge kind="note" />
        <span style={muted}>заметка на полях</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <KindBadge kind="illustration" />
        <span style={muted}>иллюстрация к рассказу</span>
      </div>
    </div>
  </Frame>
);

// Как чип стоит в шапке карточки ленты: вид + дата.
export const Inline = () => (
  <Frame>
    <div style={{ maxWidth: 440 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <KindBadge kind="illustration" />
        <time
          style={{
            fontFamily: "var(--font-mono-accent)",
            fontSize: 12,
            color: "var(--muted-foreground)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          12.05.2026
        </time>
      </div>
      <h2
        style={{
          marginTop: 12,
          fontFamily: "var(--font-prose)",
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: "-0.01em",
        }}
      >
        Сухой колодец
      </h2>
    </div>
  </Frame>
);
