import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Управляемый мок «итога снижения движения», чтобы не тянуть провайдер/motion.
const { reducedMock } = vi.hoisted(() => ({ reducedMock: vi.fn(() => false) }));
vi.mock("@/components/motion/useReducedMotionSafe", () => ({
  useReducedMotionSafe: () => reducedMock(),
}));

import { useHauntedCapability } from "@/components/haunted/useHauntedCapability";

type Opts = {
  reduced?: boolean;
  pointerFine?: boolean;
  reducedData?: boolean;
  saveData?: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
};

function configure(opts: Opts): void {
  reducedMock.mockReturnValue(opts.reduced ?? false);
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches:
      (q.includes("pointer: fine") && (opts.pointerFine ?? true)) ||
      (q.includes("prefers-reduced-data") && (opts.reducedData ?? false)),
  }));
  Object.defineProperty(navigator, "connection", {
    configurable: true,
    value: { saveData: opts.saveData ?? false },
  });
  Object.defineProperty(navigator, "deviceMemory", {
    configurable: true,
    value: opts.deviceMemory ?? 8,
  });
  Object.defineProperty(navigator, "hardwareConcurrency", {
    configurable: true,
    value: opts.hardwareConcurrency ?? 8,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useHauntedCapability", () => {
  it("reduced-motion → off", () => {
    configure({ reduced: true });
    const { result } = renderHook(() => useHauntedCapability());
    expect(result.current.level).toBe("off");
  });

  it("способный десктоп → full", () => {
    configure({ pointerFine: true, deviceMemory: 8, hardwareConcurrency: 8 });
    const { result } = renderHook(() => useHauntedCapability());
    expect(result.current).toEqual({ level: "full", pointerFine: true });
  });

  it.each([
    { case: "экономия трафика (saveData)", opts: { saveData: true } as Opts },
    { case: "prefers-reduced-data", opts: { reducedData: true } as Opts },
    { case: "мало памяти (≤2)", opts: { deviceMemory: 2 } as Opts },
    { case: "мало ядер (≤2)", opts: { hardwareConcurrency: 2 } as Opts },
    { case: "грубый указатель (тач)", opts: { pointerFine: false } as Opts },
  ])("слабое устройство: $case → static", ({ opts }) => {
    configure(opts);
    const { result } = renderHook(() => useHauntedCapability());
    expect(result.current.level).toBe("static");
  });
});
