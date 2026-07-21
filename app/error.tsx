"use client";

import { useEffect } from "react";
import { ErrorScene } from "@/components/vitrina/ErrorScene";

// Граница ошибок всего приложения (§6). До неё любое исключение в клиентском острове
// — потеря WebGL-контекста в GrainCanvas, споткнувшийся WheelCanvas, ResizeObserver
// в ReaderShell — роняло страницу в дефолтный экран Next: чужая эстетика, и читатель
// теряет место. Теперь отказ говорит голосом системы, как 404 и лоадер, и предлагает
// reset() — перемонтировать поддерево без перезагрузки.
//
// Границы Next обязаны быть клиентскими компонентами. Эта ловит ошибки рендера в
// маршрутах; отказ самого корневого layout ловит app/global-error.tsx.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Единственный след для разбора: в проде текст ошибки вырезан, остаётся digest,
    // по которому запись ищется в логах хостинга. Аналитики/Sentry в проекте нет
    // (осознанно, см. docs/задачи.md) — поэтому консоль.
    console.error("Ошибка маршрута:", error.digest ?? error);
  }, [error]);

  return <ErrorScene reset={reset} />;
}
