// Клиентское хранилище «Читальни»: настройки чтения и прогресс (localStorage).
// Используется только из клиентских компонентов; функции безопасны при SSR
// (возвращают дефолты, если хранилище недоступно).

export type ReadingTheme = "light" | "sepia" | "dark";
export type ReadingMode = "scroll" | "paged";

const THEME_KEY = "kirilov:reading-theme";
const MODE_KEY = "kirilov:reading-mode";
const PROGRESS_PREFIX = "kirilov:reading:progress:";
const LAST_KEY = "kirilov:reading:last";

/** Порог «рассказ прочитан»: доведён до конца (§8 «память Колеса»). */
export const READ_PCT = 0.9;

/** Рассказ стал прочитанным — сигнал «Колесу» в этой же вкладке (другая ловит storage). */
export const PROGRESS_EVENT = "kirilov:reading-progress";

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

// Запись прогресса: pct — где читатель сейчас (для восстановления позиции),
// max — насколько далеко он заходил КОГДА-ЛИБО (монотонен). Память «Колеса» стоит
// на max: вернуться к началу рассказа не значит его «разчитать».
type ProgressRecord = { pct?: number; max?: number; ts?: number };

function readRecord(slug: string): ProgressRecord {
  const raw = ls()?.getItem(PROGRESS_PREFIX + slug);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ProgressRecord;
  } catch {
    return {};
  }
}

/** Доля прочитанного [0..1] для рассказа (0, если не начат). */
export function getProgress(slug: string): number {
  const v = readRecord(slug).pct;
  return typeof v === "number" ? v : 0;
}

/** Максимум прочитанного за всё время [0..1]. Записи без max (до Шага 3.3) —
 *  откат на pct, чтобы старый прогресс не потерялся. */
export function getMaxProgress(slug: string): number {
  const r = readRecord(slug);
  const max = typeof r.max === "number" ? r.max : 0;
  const pct = typeof r.pct === "number" ? r.pct : 0;
  return Math.max(max, pct);
}

/** Рассказ дочитан до конца — узел «Колеса» обжит (§8). */
export function isRead(slug: string): boolean {
  return getMaxProgress(slug) >= READ_PCT;
}

/** Ключ события storage относится к прогрессу чтения? (null = localStorage.clear())
 *  Фильтр нужен, чтобы смена темы чтения в соседней вкладке не дёргала «Колесо». */
export function isProgressKey(key: string | null): boolean {
  return key === null || key.startsWith(PROGRESS_PREFIX);
}

/** Сохранить позицию рассказа + указатель «последнее прочитанное». */
export function saveProgress(info: LastRead): void {
  const store = ls();
  if (!store) return;
  const pct = Math.min(1, Math.max(0, info.pct));
  const prevMax = getMaxProgress(info.slug);
  const max = Math.max(prevMax, pct);
  store.setItem(
    PROGRESS_PREFIX + info.slug,
    JSON.stringify({ pct, max, ts: Date.now() }),
  );
  store.setItem(LAST_KEY, JSON.stringify({ ...info, pct }));
  // Событие — только в момент перехода в «прочитано»: saveProgress зовут на каждом
  // кадре скролла, а «Колесу» интересен ровно этот один переход.
  if (prevMax < READ_PCT && max >= READ_PCT) {
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  }
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
