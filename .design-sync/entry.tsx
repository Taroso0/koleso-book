// Synth-entry для design-sync (репозиторий — Next-приложение без сборки библиотеки).
// Реэкспортирует переиспользуемые примитивы из components/* в бандл window.kirilov.
// Алиас @/* → ./* и шимы next/link → <a>, next/image → <img>, next/dynamic → React.lazy
// резолвятся esbuild через cfg.tsconfig (.design-sync/tsconfig.bundle.json).
export { Button, buttonVariants } from "@/components/ui/button";
export { EmptyState } from "@/components/ui/EmptyState";
export { KindBadge } from "@/components/workshop/KindBadge";
export { ProseBody } from "@/components/reader/ProseBody";
export { GlitchText } from "@/components/haunted/GlitchText";
export { StoryOpening } from "@/components/haunted/StoryOpening";
export { SystemLoader } from "@/components/haunted/SystemLoader";
export { StaticGrain } from "@/components/haunted/StaticGrain";
export { FogReveal } from "@/components/haunted/FogReveal";
export { Reveal } from "@/components/motion/Reveal";
export { AccentLine } from "@/components/motion/AccentLine";
export { WorkshopCard } from "@/components/workshop/WorkshopCard";
export { IllustrationPlate } from "@/components/reader/IllustrationPlate";
export { WheelIndex } from "@/components/wheel/WheelIndex";
export { NotFoundScene } from "@/components/vitrina/NotFoundScene";
export { WarmWindowHero } from "@/components/vitrina/WarmWindowHero";
