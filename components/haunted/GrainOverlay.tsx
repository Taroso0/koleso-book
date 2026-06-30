"use client";

import dynamic from "next/dynamic";
import { useHauntedCapability } from "./useHauntedCapability";
import { StaticGrain } from "./StaticGrain";

// Ленивый WebGL-чанк: three грузится только когда уровень «full».
const GrainCanvas = dynamic(() => import("./GrainCanvas"), { ssr: false });

// Слой зерна/CRT (§4/§7/§11-C2). Фактура — это МАТЕРИЯ, а не роскошь устройства:
// статичное зерно/CRT-текстура — ПОЛ, видна ВСЕГДА (включая reduced и слабые/тач). По
// способности гейтится лишь ДВИЖЕНИЕ — анимированный WebGL-слой (фликер ЭЛТ, дрейф
// скан-линий) только на «full». reduced-motion гасит движение, а не мир (§11). На SSR
// уровень = «off» → рендерится StaticGrain (фактура с первого кадра, без mismatch).
export function GrainOverlay() {
  const { level } = useHauntedCapability();
  if (level === "full") return <GrainCanvas />; // фактура + движение
  return <StaticGrain />; // фактура без движения (static · weak · reduced · off)
}
