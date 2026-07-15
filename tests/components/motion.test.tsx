import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";

// Мок ОС-настройки prefers-reduced-motion из motion/react. vi.hoisted — чтобы ссылка
// на мок существовала к моменту вызова фабрики (иначе TDZ при подъёме vi.mock).
const { useReducedMotionMock } = vi.hoisted(() => ({
  useReducedMotionMock: vi.fn(() => false as boolean | null),
}));
vi.mock("motion/react", () => ({
  useReducedMotion: () => useReducedMotionMock(),
}));

import { MotionProvider, useMotionPreference } from "@/components/motion/MotionProvider";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

beforeEach(() => {
  useReducedMotionMock.mockReturnValue(false);
});

function wrapper({ children }: { children: ReactNode }) {
  return <MotionProvider>{children}</MotionProvider>;
}

describe("useReducedMotionSafe", () => {
  it("без провайдера учитывает только ОС-настройку (true)", () => {
    useReducedMotionMock.mockReturnValue(true);
    const { result } = renderHook(() => useReducedMotionSafe());
    expect(result.current).toBe(true);
  });

  it("без провайдера: ОС не снижает → false", () => {
    useReducedMotionMock.mockReturnValue(false);
    const { result } = renderHook(() => useReducedMotionSafe());
    expect(result.current).toBe(false);
  });

  it("внутри провайдера возвращает ctx.reduced", () => {
    useReducedMotionMock.mockReturnValue(true);
    const { result } = renderHook(() => useReducedMotionSafe(), { wrapper });
    expect(result.current).toBe(true);
  });
});

describe("MotionProvider / useMotionPreference", () => {
  it("читает ручной тумблер из localStorage (kirilov:reduce-effects=1)", () => {
    localStorage.setItem("kirilov:reduce-effects", "1");
    const { result } = renderHook(() => useMotionPreference(), { wrapper });
    expect(result.current.reduceEffects).toBe(true);
    expect(result.current.reduced).toBe(true);
  });

  it("setReduceEffects пишет в localStorage и обновляет состояние", () => {
    const { result } = renderHook(() => useMotionPreference(), { wrapper });
    expect(result.current.reduceEffects).toBe(false);
    act(() => result.current.setReduceEffects(true));
    expect(localStorage.getItem("kirilov:reduce-effects")).toBe("1");
    expect(result.current.reduceEffects).toBe(true);
  });

  it("setReduceEffects(false) пишет 0 в localStorage", () => {
    localStorage.setItem("kirilov:reduce-effects", "1");
    const { result } = renderHook(() => useMotionPreference(), { wrapper });
    expect(result.current.reduceEffects).toBe(true);
    act(() => result.current.setReduceEffects(false));
    expect(localStorage.getItem("kirilov:reduce-effects")).toBe("0");
    expect(result.current.reduceEffects).toBe(false);
  });

  it("reduced = ОС ИЛИ ручной тумблер", () => {
    useReducedMotionMock.mockReturnValue(true);
    const { result } = renderHook(() => useMotionPreference(), { wrapper });
    expect(result.current.reduced).toBe(true);
  });

  it("вне провайдера → бросает", () => {
    expect(() => renderHook(() => useMotionPreference())).toThrow(/внутри <MotionProvider>/);
  });
});
