// Авторская превью Reveal — обёртка «проявления» при входе в кадр: контент всплывает
// снизу и проступает (GSAP ScrollTrigger). Движется только появление, сам контент потом
// неподвижен. Есть латч: проявился — обратно не прячется.
//
// Детерминизм кадра: капчер не глушит анимации, а проявление длится 0.6 с (+стаггер).
// Просим СТАТИЧЕСКИЙ ПАРИТЕТ (reduced-motion) — он равен конечному состоянию, так что
// карточка показывает результат, а не середину твина.
import { Reveal } from "kirilov";

if (typeof window !== "undefined") {
  const real = window.matchMedia.bind(window);
  window.matchMedia = ((q: string) =>
    /prefers-reduced-motion/.test(q)
      ? {
          matches: true,
          media: q,
          onchange: null,
          addEventListener() {},
          removeEventListener() {},
          addListener() {},
          removeListener() {},
          dispatchEvent: () => false,
        }
      : real(q)) as typeof window.matchMedia;
}

const Page = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      maxWidth: "44rem",
      margin: "0 auto",
      padding: 48,
      background: "var(--background)",
      color: "var(--foreground)",
    }}
  >
    {children}
  </div>
);

const card: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: 20,
  background: "var(--card)",
};

// Одиночный блок: секция хаба проявляется целиком.
export const Block = () => (
  <Page>
    <Reveal start="top bottom">
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-prose)",
          fontSize: 30,
          fontWeight: 500,
          letterSpacing: "-0.01em",
        }}
      >
        Автор
      </h2>
      <p
        style={{
          margin: "14px 0 0",
          fontFamily: "var(--font-prose)",
          fontSize: 18,
          lineHeight: 1.7,
          color: "var(--muted-foreground)",
        }}
      >
        Евгений Кирилов пишет «офисную готику» — чудо, спрятанное в сером
        корпоративном быту.
      </p>
    </Reveal>
  </Page>
);

// stagger — прямые дети выходят по очереди (сетка книг на хабе, 0.06 с шаг).
export const Stagger = () => (
  <Page>
    <Reveal
      start="top bottom"
      stagger={0.06}
      className="reveal-preview-grid"
    >
      <div style={card}>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-mono-accent)",
            fontSize: 12,
            letterSpacing: "0.16em",
            color: "var(--muted-foreground)",
          }}
        >
          2022
        </p>
        <h3 style={{ margin: "6px 0 0", fontFamily: "var(--font-prose)", fontSize: 22, fontWeight: 500 }}>
          Колизей
        </h3>
      </div>
      <div style={card}>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-mono-accent)",
            fontSize: 12,
            letterSpacing: "0.16em",
            color: "var(--muted-foreground)",
          }}
        >
          2023
        </p>
        <h3 style={{ margin: "6px 0 0", fontFamily: "var(--font-prose)", fontSize: 22, fontWeight: 500 }}>
          Колесо Сансары
        </h3>
      </div>
    </Reveal>
    <style>{`
      .reveal-preview-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: 1fr 1fr;
      }
    `}</style>
  </Page>
);
