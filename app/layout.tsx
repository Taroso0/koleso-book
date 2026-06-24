import type { Metadata } from "next";
import { fontProse, fontSystem, fontMono } from "@/lib/fonts";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Боковым зрением — Евгений Кирилов",
  description:
    "Литературная вселенная Евгения Кирилова: «офисная готика», «Колесо» смыслов и проза, которую видно боковым зрением.",
};

// Пре-пейнт инициализация «Читальни»: тема и режим из localStorage ДО первой
// отрисовки — чтобы при F5 не было вспышки светлой темы и текста «свитком».
// Скрипт в КОРНЕВОМ layout (не ре-рендерится при навигации → нет варнинга про
// <script>); атрибуты на <html> → нужен suppressHydrationWarning.
const READING_INIT = `(function(){try{var d=document.documentElement,s=localStorage;var t=s.getItem('kirilov:reading-theme');if(t==='sepia'||t==='dark')d.dataset.readingTheme=t;if(s.getItem('kirilov:reading-mode')==='paged')d.dataset.readingMode='paged';}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${fontProse.variable} ${fontSystem.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: READING_INIT }} />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
