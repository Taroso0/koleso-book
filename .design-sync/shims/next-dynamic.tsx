// Шим next/dynamic для standalone-бандла дизайн-системы (см. next-link/next-image).
// Реальный next/dynamic тянет Next-рантайм с незащищёнными `process.env.__NEXT_*` →
// `ReferenceError: process is not defined` кладёт весь IIFE.
//
// Лоадер у нас отдаёт КОМПОНЕНТ, а не модуль: dynamic(() => import(…).then(m => m.X)).
// ssr/loading игнорируем: в бандле рендер всегда клиентский.
import * as React from "react";

export default function dynamic<P extends object>(
  loader: () => Promise<React.ComponentType<P>>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- держим сигнатуру next/dynamic
  _options?: unknown,
) {
  const Lazy = React.lazy(async () => ({ default: await loader() }));
  return function DynamicShim(props: P) {
    return (
      <React.Suspense fallback={null}>
        <Lazy {...(props as P & React.JSX.IntrinsicAttributes)} />
      </React.Suspense>
    );
  };
}
