// Авторская превью IllustrationPlate — editorial-плашка иллюстрации («с воздухом»,
// как фигура в тексте). next/image шимится на <img>. Картинка — встроенный SVG
// data-URI (демо-плейсхолдер «офисной готики»: кольцо со спицами + натриевая точка),
// чтобы показать вёрстку фигуры и подпись без обращения к серверу.
import { IllustrationPlate } from "kirilov";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
  <rect width="480" height="320" fill="#E7E2D6"/>
  <rect x="14" y="14" width="452" height="292" fill="none" stroke="#15110D" stroke-width="1" opacity="0.35"/>
  <g stroke="#15110D" stroke-width="1.4" fill="none">
    <circle cx="240" cy="160" r="98"/>
    <circle cx="240" cy="160" r="60"/>
    <line x1="240" y1="62" x2="240" y2="258"/>
    <line x1="142" y1="160" x2="338" y2="160"/>
    <line x1="171" y1="91" x2="309" y2="229"/>
    <line x1="309" y1="91" x2="171" y2="229"/>
  </g>
  <circle cx="240" cy="160" r="7" fill="#C8551E"/>
</svg>`;

const illustration = {
  src: `data:image/svg+xml,${encodeURIComponent(svg)}`,
  width: 480,
  height: 320,
  alt: "Колесо: концентрические круги с радиальными спицами и натриевой точкой в центре",
  artist: "Е. Кирилов",
};

export const Plate = () => (
  <div
    style={{
      padding: 24,
      background: "var(--background)",
      color: "var(--foreground)",
      fontFamily: "var(--font-prose)",
    }}
  >
    <IllustrationPlate illustration={illustration} />
  </div>
);
