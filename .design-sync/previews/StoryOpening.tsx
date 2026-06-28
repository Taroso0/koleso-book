// Авторская превью StoryOpening — «первая строка как событие» (зачин рассказа).
// Кинетика (rise/cascade — GSAP SplitText; glitch — GlitchText) проявляется в живом
// дизайне; статичный кадр показывает осевшую первую строку в полноценной композиции
// (паритет статического сценария). variant выбирает шаблон входа.
import { StoryOpening } from "kirilov";

export const FirstLine = () => (
  <div
    style={{
      maxWidth: "42rem",
      margin: "0 auto",
      padding: 40,
      background: "var(--background)",
      color: "var(--foreground)",
      fontFamily: "var(--font-prose)",
    }}
  >
    <div
      style={{
        fontFamily: "var(--font-mono-accent)",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: "0.16em",
        color: "var(--muted-foreground)",
      }}
    >
      рассказ · зачин
    </div>
    <StoryOpening
      text="Город затих так внезапно, будто кто-то снял трубку и весь шум переключили на удержание."
      variant="rise"
      className="story-opening-preview"
    />
    <style>{`
      .story-opening-preview {
        display: block;
        margin: 18px 0 0;
        font-family: var(--font-prose);
        font-size: 30px;
        line-height: 1.3;
        letter-spacing: -0.01em;
        text-wrap: balance;
      }
    `}</style>
    <p
      style={{
        margin: "20px 0 0",
        fontSize: 18,
        lineHeight: 1.7,
        color: "var(--muted-foreground)",
      }}
    >
      Дальше текст идёт обычным набором — двигалось только сверхъестественное,
      а проза остаётся неподвижной и читаемой.
    </p>
  </div>
);
