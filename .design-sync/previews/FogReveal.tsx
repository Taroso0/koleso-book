// Авторская превью FogReveal — «карта проявляется из тумана»: контент выходит из
// размытия. Тяжёлый жест, приберегается для одного объекта на экран (в проекте — граф
// «Колеса» в ночи).
//
// Детерминизм кадра: капчер не глушит анимации, а выход из тумана длится 1.3 с — кадр
// поймал бы размытую середину. Просим СТАТИЧЕСКИЙ ПАРИТЕТ (reduced-motion): blur 0,
// opacity 1 — ровно конечное состояние.
import { FogReveal } from "kirilov";

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

// Ночная сцена: .dark переопределяет токены каскадом — как на хабе под «Колесом».
export const OutOfTheFog = () => (
  <div
    className="dark"
    style={{
      minHeight: "100svh",
      display: "grid",
      placeContent: "center",
      padding: 48,
      background: "var(--background)",
      color: "var(--foreground)",
    }}
  >
    <FogReveal start="top bottom">
      <div style={{ maxWidth: "34rem", textAlign: "center" }}>
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
          Колесо · тема
        </p>
        <p
          style={{
            margin: "18px 0 0",
            fontFamily: "var(--font-prose)",
            fontSize: 34,
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
            color: "var(--sodium)",
          }}
        >
          Перерождение
        </p>
        <p
          style={{
            margin: "14px 0 0",
            fontFamily: "var(--font-prose)",
            fontSize: 17,
            lineHeight: 1.7,
            color: "var(--muted-foreground)",
          }}
        >
          Карта смыслов не открывается сразу: сначала она — туман, и только
          потом в нём проступают связи.
        </p>
      </div>
    </FogReveal>
  </div>
);
