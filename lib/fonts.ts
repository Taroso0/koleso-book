import { Source_Serif_4, Inter, JetBrains_Mono } from "next/font/google";

/** Проза — «душа»: гуманистическая антиква с кириллицей (вариативная). §9 */
export const fontProse = Source_Serif_4({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--font-prose",
  preload: true,
});

/** Система/UI — «машина»: холодный гротеск Inter (отличная кириллица, вариативный). */
export const fontSystem = Inter({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--font-system",
  preload: true,
});

/** Моноширинный акцент — «машина»: JetBrains Mono (кириллица есть). */
export const fontMono = JetBrains_Mono({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--font-mono-accent",
  preload: false,
});
