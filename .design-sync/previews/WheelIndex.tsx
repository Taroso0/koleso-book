// Авторская превью WheelIndex — доступный двойник «Колеса» (КАНОНИЧЕСКАЯ навигация:
// список «тема → рассказы», нативные ссылки + заголовки + landmark). next/link
// шимится на <a>. Граф передаётся фикс-литералом (демо-данные, не канон); groupByTheme
// внутри компонента — чистая. Импорт из пакета → window.Kirilov.WheelIndex.
import { WheelIndex } from "kirilov";

const graph = {
  nodes: [
    { id: "soul", kind: "theme" as const, label: "Душа" },
    { id: "time", kind: "theme" as const, label: "Время" },
    { id: "memory", kind: "theme" as const, label: "Память" },
    { id: "st-wheel", kind: "story" as const, label: "Колесо", book: "koleso" },
    { id: "st-mirror", kind: "story" as const, label: "Зеркальный зал", book: "kolizey" },
    { id: "st-archive", kind: "story" as const, label: "Архив несбывшегося", book: "koleso" },
    { id: "st-stop", kind: "story" as const, label: "Город на удержании", book: "koleso" },
    { id: "st-light", kind: "story" as const, label: "Свет в дальнем кабинете", book: "kolizey" },
  ],
  links: [
    { source: "st-wheel", target: "soul", weight: 1 },
    { source: "st-wheel", target: "time", weight: 1 },
    { source: "st-mirror", target: "soul", weight: 1 },
    { source: "st-mirror", target: "memory", weight: 1 },
    { source: "st-archive", target: "memory", weight: 1 },
    { source: "st-archive", target: "time", weight: 1 },
    { source: "st-stop", target: "time", weight: 1 },
    { source: "st-light", target: "soul", weight: 1 },
  ],
};

export const Index = () => (
  <div
    style={{
      maxWidth: "42rem",
      margin: "0 auto",
      padding: 32,
      background: "var(--background)",
      color: "var(--foreground)",
      fontFamily: "var(--font-system)",
    }}
  >
    <WheelIndex graph={graph} />
  </div>
);
