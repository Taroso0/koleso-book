import { describe, it, expect, vi, afterEach } from "vitest";

// memoInBuild ветвится по NODE_ENV на уровне модуля, поэтому каждый сценарий
// импортируется заново через vi.resetModules() с подменённым окружением.
async function loadWithEnv(env: string) {
  vi.stubEnv("NODE_ENV", env);
  vi.resetModules();
  return (await import("@/lib/buildCache")).memoInBuild;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("memoInBuild", () => {
  it("в проде читает источник один раз, дальше отдаёт то же значение", async () => {
    const memoInBuild = await loadWithEnv("production");
    const load = vi.fn(() => ({ n: 1 }));
    const get = memoInBuild(load);

    const a = get();
    const b = get();

    expect(load).toHaveBeenCalledTimes(1);
    expect(b).toBe(a); // тот же объект, а не эквивалентный
  });

  it("в dev не кэширует — иначе правка контента не подхватится без перезапуска", async () => {
    const memoInBuild = await loadWithEnv("development");
    const load = vi.fn(() => ({ n: 1 }));
    const get = memoInBuild(load);

    get();
    get();

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("в тестах не кэширует — моки node:fs рассчитывают на чтение при каждом вызове", async () => {
    const memoInBuild = await loadWithEnv("test");
    const load = vi.fn(() => ({ n: 1 }));
    const get = memoInBuild(load);

    get();
    get();

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("кэширует и falsy-значения (null/0/пустой массив) — не зовёт загрузчик заново", async () => {
    const memoInBuild = await loadWithEnv("production");
    for (const value of [null, 0, "", [] as unknown[]]) {
      const load = vi.fn(() => value);
      const get = memoInBuild(load);
      get();
      get();
      expect(load).toHaveBeenCalledTimes(1);
    }
  });

  it("ленив: не зовёт загрузчик, пока результат не понадобился", async () => {
    const memoInBuild = await loadWithEnv("production");
    const load = vi.fn(() => 42);

    memoInBuild(load);

    expect(load).not.toHaveBeenCalled();
  });
});
