"use client";

import dynamic from "next/dynamic";
import { useHauntedCapability } from "./useHauntedCapability";
import { StaticGrain } from "./StaticGrain";

// Ленивый WebGL-чанк: three грузится только когда уровень «full».
const GrainCanvas = dynamic(() => import("./GrainCanvas"), { ssr: false });

// Слой зерна/CRT (§7/§11-C2): WebGL на способном десктопе, статичное SVG-зерно на
// слабых/экономных, под reduced — ничего. Само-гейтится.
export function GrainOverlay() {
  const { level } = useHauntedCapability();
  if (level === "full") return <GrainCanvas />;
  if (level === "static") return <StaticGrain />;
  return null;
}
