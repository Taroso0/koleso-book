import type { Metadata } from "next";
import { fontProse, fontSystem, fontMono } from "@/lib/fonts";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const SITE_DESCRIPTION =
  "Литературная вселенная Евгения Кирилова: «офисная готика», «Колесо» смыслов и проза, которую видно боковым зрением.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Боковым зрением — Евгений Кирилов",
  description: SITE_DESCRIPTION,
  applicationName: "Боковым зрением",
  authors: [{ name: "Евгений Кирилов" }],
  creator: "Евгений Кирилов",
  keywords: [
    "Евгений Кирилов",
    "боковым зрением",
    "офисная готика",
    "магический реализм",
    "Колизей",
    "Колесо Сансары",
    "рассказы",
    "русская проза",
  ],
  openGraph: {
    type: "website",
    siteName: "Боковым зрением",
    locale: "ru_RU",
    url: SITE_URL,
    title: "Боковым зрением — Евгений Кирилов",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Боковым зрением — Евгений Кирилов",
    description: SITE_DESCRIPTION,
  },
};

// Структурированные данные сайта/автора (§11-E3): помогают поиску и соц-превью.
const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "Боковым зрением",
      url: SITE_URL,
      inLanguage: "ru",
      author: { "@type": "Person", name: "Евгений Кирилов" },
    },
    {
      "@type": "Person",
      name: "Евгений Кирилов",
      jobTitle: "Писатель",
      knowsAbout: ["магический реализм", "офисная готика"],
    },
  ],
};

// Пре-пейнт инициализация «Читальни»: тема и режим из localStorage ДО первой
// отрисовки — чтобы при F5 не было вспышки светлой темы и текста «свитком».
// Скрипт в КОРНЕВОМ layout (не ре-рендерится при навигации → нет варнинга про
// <script>); атрибуты на <html> → нужен suppressHydrationWarning.
const READING_INIT = `(function(){try{var d=document.documentElement,s=localStorage;var t=s.getItem('kirilov:reading-theme');if(t==='sepia'||t==='dark')d.dataset.readingTheme=t;if(s.getItem('kirilov:reading-mode')==='paged')d.dataset.readingMode='paged';}catch(e){}})();`;

// Пре-пейнт гейт зачина hero: ставит data-zachin-boot на <html> ДО первой отрисовки, если
// событие будет играть — иначе статичная строка кикера мигнёт и исчезнет. Логика сознательно
// дублирует HeroZachin: решить нужно ДО гидрации.
// Почему в КОРНЕВОМ layout, а не рядом с hero: React 19 варнит про <script> только когда
// СОЗДАЁТ его узел на клиенте (createInstance — маунт/клиентская навигация; там скрипт всё
// равно обезврежен и не исполняется). Корневой layout гидратируется однажды и не
// пересоздаётся → варнинга нет. Тот же довод, что у READING_INIT выше.
// Атрибут глобальный (ставится на любом маршруте), но безвредный: CSS скоупит его строго на
// `.warm-hero` (есть только на хабе). Побочно полезно — при переходе на «/» строка уже скрыта
// до решения HeroZachin. На client-nav скрипт не нужен: setPhase("armed") из layout-эффекта
// флашится синхронно ДО пейнта. no-JS: скрипт не исполнится → строка видима (паритет).
// HeroZachin снимает атрибут в layout-эффекте в ЛЮБОМ исходе.
const ZACHIN_BOOT = `try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&!matchMedia("(prefers-reduced-data: reduce)").matches&&!(navigator.connection&&navigator.connection.saveData)&&localStorage.getItem("kirilov:reduce-effects")!=="1"&&!sessionStorage.getItem("zachin:hero"))document.documentElement.setAttribute("data-zachin-boot","")}catch(e){}`;

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
        <script dangerouslySetInnerHTML={{ __html: ZACHIN_BOOT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }}
        />
        {/* Обход повторяющейся навигации (WCAG 2.4.1): первой по Tab — ссылка к
            содержимому; видима только при фокусе, ведёт на <main id="main"> страницы. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] focus:rounded-sm focus:border focus:border-border focus:bg-background focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:text-foreground"
        >
          К содержимому
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
