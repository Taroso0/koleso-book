// Клиентское хранилище «Читальни»: настройки чтения и прогресс (localStorage).
// Используется только из клиентских компонентов; функции безопасны при SSR
// (возвращают дефолты, если хранилище недоступно).

export type ReadingTheme = "light" | "sepia" | "dark";
export type ReadingMode = "scroll" | "paged";

const THEME_KEY = "kirilov:reading-theme";
const MODE_KEY = "kirilov:reading-mode";
const PROGRESS_PREFIX = "kirilov:reading:progress:";
const LAST_KEY = "kirilov:reading:last";

function ls(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null; // localStorage может быть заблокирован (privacy mode)
  }
}

export function getReadingTheme(): ReadingTheme {
  const v = ls()?.getItem(THEME_KEY);
  return v === "sepia" || v === "dark" ? v : "light";
}

export function applyReadingTheme(theme: ReadingTheme): void {
  document.documentElement.dataset.readingTheme = theme;
  ls()?.setItem(THEME_KEY, theme);
}

export function getReadingMode(): ReadingMode {
  return ls()?.getItem(MODE_KEY) === "paged" ? "paged" : "scroll";
}

export function setReadingMode(mode: ReadingMode): void {
  ls()?.setItem(MODE_KEY, mode);
}

export type LastRead = {
  slug: string;
  bookId: string;
  bookTitle: string;
  title: string;
  pct: number;
};

/** Доля прочитанного [0..1] для рассказа (0, если не начат). */
export function getProgress(slug: string): number {
  const raw = ls()?.getItem(PROGRESS_PREFIX + slug);
  if (!raw) return 0;
  try {
    const v = JSON.parse(raw) as { pct?: number };
    return typeof v.pct === "number" ? v.pct : 0;
  } catch {
    return 0;
  }
}

/** Сохранить позицию рассказа + указатель «последнее прочитанное». */
export function saveProgress(info: LastRead): void {
  const store = ls();
  if (!store) return;
  const pct = Math.min(1, Math.max(0, info.pct));
  store.setItem(PROGRESS_PREFIX + info.slug, JSON.stringify({ pct, ts: Date.now() }));
  store.setItem(LAST_KEY, JSON.stringify({ ...info, pct }));
}

export function getLastRead(): LastRead | null {
  const raw = ls()?.getItem(LAST_KEY);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as LastRead;
    return v && typeof v.slug === "string" ? v : null;
  } catch {
    return null;
  }
}
