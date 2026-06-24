// «Читальня» (Чтение): нативный скролл, БЕЗ Lenis и тяжёлого моушена (§3/§11-C1).
// Длинный текст несовместим с инерционным скроллом.
// .reading-root — носитель тем чтения (светлая/сепия/тёмная): переопределяет токены.
// Инлайн-скрипт ставит data-reading-theme на <html> до отрисовки (без вспышки темы).

const THEME_INIT = `try{var t=localStorage.getItem('kirilov:reading-theme');if(t==='sepia'||t==='dark')document.documentElement.dataset.readingTheme=t;}catch(e){}`;

export default function ChitalnyaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      <div className="reading-root min-h-dvh">{children}</div>
    </>
  );
}
