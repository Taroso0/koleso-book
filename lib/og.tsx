import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

// OG-карточка «офисной готики» (§4/§5/§11-E3): тёплое окно (манильский «документ»)
// в холодной громаде; первая строка рассказа — герой. satori принимает woff (НЕ woff2),
// поэтому кириллицу берём из @fontsource subset-файлов (next/og несёт только Geist — без
// кириллицы → было бы «тофу»).

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const FILES = path.join(process.cwd(), "node_modules", "@fontsource");

async function ogFonts() {
  const [serif, mono] = await Promise.all([
    readFile(
      path.join(FILES, "source-serif-4/files/source-serif-4-cyrillic-600-normal.woff"),
    ),
    readFile(
      path.join(FILES, "jetbrains-mono/files/jetbrains-mono-cyrillic-500-normal.woff"),
    ),
  ]);
  return [
    { name: "Serif", data: serif, weight: 600 as const, style: "normal" as const },
    { name: "Mono", data: mono, weight: 500 as const, style: "normal" as const },
  ];
}

// Палитра — sRGB-приближение OKLCH-токенов (OG не читает CSS-переменные).
const INK = "#26292f"; // foreground (холодный почти-чёрный)
const PAPER = "#eae3d2"; // манильский беж — «документ»
const PAPER_EDGE = "#cfc7b2";
const MUTED = "#6b6456"; // приглушённый текст на бумаге
const SODIUM = "#c8742a"; // натриевый тёплый свет
const NIGHT = "#24272d"; // холодная громада вокруг

type OgCardProps = {
  headline: string;
  footerLeft: string;
  footerRight: string;
};

const clamp = (s: string, n: number) =>
  s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;

/** Отрисовать OG-карточку (1200×630) с заданной строкой-героем. */
export async function ogCard({ headline, footerLeft, footerRight }: OgCardProps) {
  const label = {
    display: "flex",
    justifyContent: "space-between",
    fontFamily: "Mono",
    fontSize: 22,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: MUTED,
  };
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: NIGHT,
          padding: 44,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: PAPER,
            border: `1px solid ${PAPER_EDGE}`,
            padding: "56px 64px",
          }}
        >
          <div style={label}>
            <span>Евгений Кирилов</span>
            <span>боковым зрением</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ width: 104, height: 6, background: SODIUM, marginBottom: 30 }} />
            <div
              style={{
                fontFamily: "Serif",
                fontWeight: 600,
                fontSize: 56,
                lineHeight: 1.18,
                color: INK,
              }}
            >
              {clamp(headline, 150)}
            </div>
          </div>

          <div style={label}>
            <span>{clamp(footerLeft, 40)}</span>
            <span>{footerRight}</span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
