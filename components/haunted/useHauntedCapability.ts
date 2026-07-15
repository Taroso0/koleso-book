"use client";

import { useMemo } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { useHydrated } from "@/components/motion/useHydrated";

export type HauntedLevel = "full" | "static" | "off";

type Capability = { level: HauntedLevel; pointerFine: boolean };

const OFF: Capability = { level: "off", pointerFine: false };

// Реальная детекция устройства (только на клиенте: navigator/matchMedia).
function computeCapability(): Capability {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  const mq = (q: string) =>
    typeof matchMedia !== "undefined" && matchMedia(q).matches;

  const saveData = Boolean(nav.connection?.saveData);
  const reducedData = mq("(prefers-reduced-data: reduce)");
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2;
  const lowCores =
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 2;
  const pointerFine = mq("(pointer: fine)");
  const coarse = !pointerFine; // тач/мобильный — без WebGL (батарея/GPU, §C2)

  const weak = saveData || reducedData || lowMemory || lowCores || coarse;
  return { level: weak ? "static" : "full", pointerFine };
}

// Возможности устройства для слоя «офисной готики» (§11-C2): WebGL-зерно только на
// способном десктопе; слабым/экономным — статичный фолбэк; reduced — ничего.
// Считается на КЛИЕНТЕ после гидратации (SSR → off, оверлеи null) — без
// hydration-mismatch и без setState-в-effect.
export function useHauntedCapability(): Capability {
  const reduced = useReducedMotionSafe();
  const hydrated = useHydrated();
  return useMemo(
    () => (hydrated && !reduced ? computeCapability() : OFF),
    [hydrated, reduced],
  );
}
