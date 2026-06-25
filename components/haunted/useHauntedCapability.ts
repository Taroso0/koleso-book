"use client";

import { useEffect, useState } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

export type HauntedLevel = "full" | "static" | "off";

type Capability = { level: HauntedLevel; pointerFine: boolean };

// Возможности устройства для слоя «офисной готики» (§11-C2): WebGL-зерно только на
// способном десктопе; слабым/экономным — статичный фолбэк; reduced — ничего.
// Считается на КЛИЕНТЕ после маунта (SSR → off, оверлеи null) — без hydration-mismatch.
export function useHauntedCapability(): Capability {
  const reduced = useReducedMotionSafe();
  const [cap, setCap] = useState<Capability>({ level: "off", pointerFine: false });

  useEffect(() => {
    if (reduced) {
      setCap({ level: "off", pointerFine: false });
      return;
    }

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
    setCap({ level: weak ? "static" : "full", pointerFine });
  }, [reduced]);

  return cap;
}
