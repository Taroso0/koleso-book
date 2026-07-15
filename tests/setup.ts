import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom в этой связке не отдаёт рабочий localStorage (Node-фолбэк отключён), а «Читальня»
// (components/reader/reading.ts) и MotionProvider на нём стоят. Ставим детерминированный
// in-memory Storage перед каждым тестом — свежий, поэтому состояние не течёт между тестами.
class MemoryStorage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

/** Свежий in-memory localStorage на window и globalThis. Экспортируется, чтобы тест
 *  privacy-mode мог восстановить хранилище после подмены на «бросающий» геттер. */
export function installMemoryStorage(): void {
  vi.stubGlobal("localStorage", new MemoryStorage());
}

beforeEach(() => {
  installMemoryStorage();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
