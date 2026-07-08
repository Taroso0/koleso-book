import { systemVoice } from "@/content/systemVoice";

// Suspense-фолбэк маршрута (§6). Мгновенный рендер, без клиентского JS: реплика
// статична (моно = «машина»), «характер» — регистр + натриевая сканирующая черта
// (CSS). reduced-motion → черта статична (globals.css). role=status для SR.
// Класс `dark` — сцена «офис ночью»: в репо :root светлый, а лоадер должен быть тёмным,
// поэтому var(--background)/var(--foreground) резолвим через .dark (как .wheel-night).
export function SystemLoader({ label = "Сборка мира" }: { label?: string }) {
  return (
    <div className="system-loader dark" role="status" aria-live="polite">
      <p className="system-loader__eyebrow font-mono">{label}</p>
      <p className="system-loader__line font-mono">{systemVoice.loading}</p>
      <div className="system-loader__scan" aria-hidden />
    </div>
  );
}
