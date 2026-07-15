import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReadStories } from "@/components/wheel/readStories";
import { buildGraph } from "@/lib/graph";
import { PROGRESS_EVENT } from "@/components/reader/reading";
import type { Story, Theme } from "@/content/schema";

const PROGRESS_PREFIX = "kirilov:reading:progress:";
const themes: Theme[] = [{ id: "soul", label: "Душа" }];

function story(slug: string): Story {
  return { slug, title: slug, book: "koleso", order: 1, firstLine: "x", themes: ["soul"], body: "" };
}

const graph = buildGraph([story("a"), story("b")], themes);

function markRead(slug: string): void {
  localStorage.setItem(PROGRESS_PREFIX + slug, JSON.stringify({ max: 1 }));
}

describe("useReadStories", () => {
  it("изначально пусто, если ничего не прочитано", () => {
    const { result } = renderHook(() => useReadStories(graph));
    expect(result.current.size).toBe(0);
  });

  it("на маунте собирает уже прочитанные рассказы", () => {
    markRead("a");
    const { result } = renderHook(() => useReadStories(graph));
    expect([...result.current]).toEqual(["a"]);
  });

  it("реагирует на PROGRESS_EVENT (эта вкладка)", () => {
    const { result } = renderHook(() => useReadStories(graph));
    expect(result.current.size).toBe(0);
    act(() => {
      markRead("b");
      window.dispatchEvent(new Event(PROGRESS_EVENT));
    });
    expect([...result.current]).toEqual(["b"]);
  });

  it("реагирует на storage-событие с ключом прогресса", () => {
    const { result } = renderHook(() => useReadStories(graph));
    act(() => {
      markRead("a");
      window.dispatchEvent(new StorageEvent("storage", { key: PROGRESS_PREFIX + "a" }));
    });
    expect([...result.current]).toEqual(["a"]);
  });

  it("игнорирует storage-событие с посторонним ключом", () => {
    const { result } = renderHook(() => useReadStories(graph));
    act(() => {
      markRead("a");
      window.dispatchEvent(new StorageEvent("storage", { key: "kirilov:reading-theme" }));
    });
    expect(result.current.size).toBe(0);
  });

  it("обновляется при равном размере, но ином составе", () => {
    markRead("a");
    const { result } = renderHook(() => useReadStories(graph));
    expect([...result.current]).toEqual(["a"]);
    act(() => {
      localStorage.removeItem(PROGRESS_PREFIX + "a"); // a больше не прочитан
      markRead("b"); // зато b прочитан — размер тот же (1), состав иной
      window.dispatchEvent(new Event(PROGRESS_EVENT));
    });
    expect([...result.current]).toEqual(["b"]);
  });

  it("стабильность ссылки: неизменный состав → тот же объект Set", () => {
    const { result } = renderHook(() => useReadStories(graph));
    const first = result.current;
    act(() => {
      window.dispatchEvent(new Event(PROGRESS_EVENT));
    });
    expect(result.current).toBe(first);
  });
});
