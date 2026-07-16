// Авторская превью AnchorPlate — плашка-якорь «Колеса» (§8): паспарту «карточка»
// с зерном + изображение в родной палитре. Позицию/состояние в приложении считает
// WheelCanvas; здесь — относительный контейнер-сцена (компонент абсолютен,
// transform -50%,-50%). Три состояния рядом: покой (0.62) · lit (1) · dim (0.3).
// Сцена тёмная (.dark + .wheel-night не тянем — достаточно тёмного фона контейнера),
// как на живой карте. next/image шимится на <img>; картинка — data-URI SVG
// (демо-плейсхолдер «офисной готики», портретная как плашки Кучеренко).
import type { ReactNode } from "react";
import { AnchorPlate } from "kirilov";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="290" height="420" viewBox="0 0 290 420">
  <rect width="290" height="420" fill="#E7E2D6"/>
  <rect x="12" y="12" width="266" height="396" fill="none" stroke="#15110D" stroke-width="1" opacity="0.35"/>
  <g stroke="#15110D" stroke-width="1.4" fill="none">
    <circle cx="145" cy="150" r="80"/>
    <circle cx="145" cy="150" r="48"/>
    <line x1="145" y1="70" x2="145" y2="230"/>
    <line x1="65" y1="150" x2="225" y2="150"/>
  </g>
  <circle cx="145" cy="150" r="6" fill="#C8551E"/>
  <path d="M60 300 q42 -34 85 0 t85 0" stroke="#15110D" stroke-width="1.4" fill="none"/>
  <path d="M60 330 q42 -34 85 0 t85 0" stroke="#15110D" stroke-width="1" fill="none" opacity="0.5"/>
</svg>`;
const src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
const img = { src, width: 290, height: 420 };

const Scene = ({ children }: { children: ReactNode }) => (
  <div
    className="dark"
    style={{
      position: "relative",
      width: 180,
      height: 190,
      background: "oklch(0.16 0.012 256)",
    }}
  >
    {children}
  </div>
);

// Покой: тишина 0.62 — плашка «живёт» на карте, не перетягивая взгляд.
export const Rest = () => (
  <Scene>
    <AnchorPlate {...img} left="50%" top="50%" lit={false} dimmed={false} lift={false} />
  </Scene>
);

// Тема горит: полная плотность (+ подъём паспарту под живым вниманием).
export const Lit = () => (
  <Scene>
    <AnchorPlate {...img} left="50%" top="50%" lit dimmed={false} lift />
  </Scene>
);

// Внимание на другом узле: глушится вместе со своей темой (0.3).
export const Dimmed = () => (
  <Scene>
    <AnchorPlate {...img} left="50%" top="50%" lit={false} dimmed lift={false} />
  </Scene>
);
