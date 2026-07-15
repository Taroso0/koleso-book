import { describe, it, expect, vi } from "vitest";
import {
  getReadingTheme,
  applyReadingTheme,
  getReadingMode,
  setReadingMode,
  getProgress,
  getMaxProgress,
  isRead,
  isProgressKey,
  saveProgress,
  getLastRead,
  READ_PCT,
  PROGRESS_EVENT,
  type LastRead,
} from "@/components/reader/reading";
import { installMemoryStorage } from "../setup";

const PROGRESS_PREFIX = "kirilov:reading:progress:";

function lastRead(over: Partial<LastRead> = {}): LastRead {
  return {
    slug: "s1",
    bookId: "kolizey",
    bookTitle: "Колизей",
    title: "Рассказ",
    pct: 0.5,
    ...over,
  };
}

describe("тема чтения", () => {
  it("по умолчанию light", () => {
    expect(getReadingTheme()).toBe("light");
  });

  it("валидное значение читается из хранилища", () => {
    localStorage.setItem("kirilov:reading-theme", "dark");
    expect(getReadingTheme()).toBe("dark");
  });

  it("невалидное значение → фолбэк light", () => {
    localStorage.setItem("kirilov:reading-theme", "неон");
    expect(getReadingTheme()).toBe("light");
  });

  it("applyReadingTheme пишет в localStorage и в data-атрибут", () => {
    applyReadingTheme("sepia");
    expect(getReadingTheme()).toBe("sepia");
    expect(document.documentElement.dataset.readingTheme).toBe("sepia");
  });
});

describe("режим чтения", () => {
  it("по умолчанию scroll", () => {
    expect(getReadingMode()).toBe("scroll");
  });

  it("paged сохраняется и читается", () => {
    setReadingMode("paged");
    expect(getReadingMode()).toBe("paged");
  });

  it("любое иное значение трактуется как scroll", () => {
    setReadingMode("scroll");
    expect(getReadingMode()).toBe("scroll");
  });
});

describe("прогресс чтения", () => {
  it("не начатый рассказ → 0", () => {
    expect(getProgress("нет")).toBe(0);
    expect(getMaxProgress("нет")).toBe(0);
  });

  it("getMaxProgress: запись без max откатывается на pct", () => {
    localStorage.setItem(PROGRESS_PREFIX + "s1", JSON.stringify({ pct: 0.42 }));
    expect(getMaxProgress("s1")).toBe(0.42);
  });

  it("getMaxProgress берёт максимум из max и pct", () => {
    localStorage.setItem(PROGRESS_PREFIX + "s1", JSON.stringify({ pct: 0.2, max: 0.7 }));
    expect(getMaxProgress("s1")).toBe(0.7);
  });

  it("битый JSON записи → 0", () => {
    localStorage.setItem(PROGRESS_PREFIX + "s1", "{ не json");
    expect(getProgress("s1")).toBe(0);
    expect(getMaxProgress("s1")).toBe(0);
  });

  it("isRead: порог READ_PCT (0.9)", () => {
    localStorage.setItem(PROGRESS_PREFIX + "s1", JSON.stringify({ max: READ_PCT }));
    expect(isRead("s1")).toBe(true);
    localStorage.setItem(PROGRESS_PREFIX + "s2", JSON.stringify({ max: READ_PCT - 0.01 }));
    expect(isRead("s2")).toBe(false);
  });
});

describe("isProgressKey", () => {
  it("null (localStorage.clear) → true", () => {
    expect(isProgressKey(null)).toBe(true);
  });
  it("ключ прогресса → true", () => {
    expect(isProgressKey(PROGRESS_PREFIX + "s1")).toBe(true);
  });
  it("посторонний ключ (тема) → false", () => {
    expect(isProgressKey("kirilov:reading-theme")).toBe(false);
  });
});

describe("saveProgress", () => {
  it("кламп pct в [0..1]", () => {
    saveProgress(lastRead({ slug: "s1", pct: 1.5 }));
    expect(getProgress("s1")).toBe(1);
    saveProgress(lastRead({ slug: "s2", pct: -0.5 }));
    expect(getProgress("s2")).toBe(0);
  });

  it("max монотонен: откат назад не уменьшает max", () => {
    saveProgress(lastRead({ slug: "s1", pct: 0.8 }));
    saveProgress(lastRead({ slug: "s1", pct: 0.2 }));
    expect(getProgress("s1")).toBe(0.2);
    expect(getMaxProgress("s1")).toBe(0.8);
  });

  it("пишет указатель «последнее прочитанное» с клампнутым pct", () => {
    saveProgress(lastRead({ slug: "s1", pct: 0.3 }));
    expect(getLastRead()?.slug).toBe("s1");
    expect(getLastRead()?.pct).toBe(0.3);
  });

  it("PROGRESS_EVENT диспатчится ровно при переходе через порог и не повторяется", () => {
    const handler = vi.fn();
    window.addEventListener(PROGRESS_EVENT, handler);
    saveProgress(lastRead({ slug: "s1", pct: 0.5 })); // ниже порога — нет события
    expect(handler).not.toHaveBeenCalled();
    saveProgress(lastRead({ slug: "s1", pct: 0.95 })); // переход — одно событие
    expect(handler).toHaveBeenCalledTimes(1);
    saveProgress(lastRead({ slug: "s1", pct: 0.98 })); // уже прочитан — повторно не диспатчит
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(PROGRESS_EVENT, handler);
  });
});

describe("getLastRead", () => {
  it("пусто → null", () => {
    expect(getLastRead()).toBeNull();
  });
  it("битый JSON → null", () => {
    localStorage.setItem("kirilov:reading:last", "{ не json");
    expect(getLastRead()).toBeNull();
  });
  it("объект без slug → null", () => {
    localStorage.setItem("kirilov:reading:last", JSON.stringify({ pct: 0.5 }));
    expect(getLastRead()).toBeNull();
  });
});

describe("privacy-mode (доступ к localStorage бросает)", () => {
  it("ls() → null: безопасные дефолты, saveProgress — no-op", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("заблокировано privacy-режимом");
      },
    });
    expect(getReadingTheme()).toBe("light");
    expect(getProgress("s1")).toBe(0);
    expect(() => saveProgress(lastRead())).not.toThrow();
    expect(getLastRead()).toBeNull();
    installMemoryStorage(); // восстановить хранилище для последующих тестов
  });
});
