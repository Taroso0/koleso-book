// Авторская превью AccentLine — короткая натриевая черта под заголовком: единственный
// «горячий» акцент в институциональных нейтралях. В живом дизайне прочерчивается слева
// при входе в кадр (GSAP ScrollTrigger).
//
// Детерминизм кадра: капчер не глушит анимации, а прочерк длится 0.7 с. Просим у
// компонента СТАТИЧЕСКИЙ ПАРИТЕТ (reduced-motion) — он совпадает с конечным состоянием
// черты, поэтому карточка показывает ровно то, что увидит человек после анимации.
import { AccentLine } from "kirilov";

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
      maxWidth: "42rem",
      margin: "0 auto",
      padding: 48,
      background: "var(--background)",
      color: "var(--foreground)",
    }}
  >
    {children}
  </div>
);

// Канон: заголовок раздела → черта → проза. Так размечены все секции «Витрины».
export const UnderHeading = () => (
  <Page>
    <h2
      style={{
        margin: 0,
        fontFamily: "var(--font-prose)",
        fontSize: 30,
        fontWeight: 500,
        letterSpacing: "-0.01em",
      }}
    >
      Мастерская
    </h2>
    {/* На сайте черта стоит с отступом от заголовка (`mt-3`), а не вплотную. */}
    <div style={{ marginTop: 12 }}>
      <AccentLine start="top bottom" />
    </div>
    <p
      style={{
        margin: "16px 0 0",
        fontFamily: "var(--font-prose)",
        fontSize: 18,
        lineHeight: 1.7,
        color: "var(--muted-foreground)",
      }}
    >
      Третья книга растёт на глазах: фрагменты, черновики, заметки и новые
      иллюстрации.
    </p>
  </Page>
);

// Разделитель между блоками — та же черта без заголовка над ней.
export const AsDivider = () => (
  <Page>
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
      2023 · Колесо Сансары
    </p>
    <div style={{ marginTop: 12 }}>
      <AccentLine start="top bottom" />
    </div>
  </Page>
);
