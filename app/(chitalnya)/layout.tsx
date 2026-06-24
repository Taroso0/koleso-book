// «Читальня» (Чтение): нативный скролл, БЕЗ Lenis и тяжёлого моушена (§3/§11-C1).
// Длинный текст несовместим с инерционным скроллом.
// .reading-root — носитель тем чтения (светлая/сепия/тёмная): переопределяет токены.
// Тему/режим до отрисовки ставит пре-пейнт скрипт в корневом layout (анти-FOUC).
export default function ChitalnyaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="reading-root min-h-dvh">{children}</div>;
}
