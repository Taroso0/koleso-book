// Synth-entry для design-sync (репозиторий — Next-приложение без сборки библиотеки).
// Реэкспортирует переиспользуемые примитивы из components/* в бандл window.kirilov.
// Алиас @/* → ./* и шимы next/link → <a>, next/image → <img> резолвятся esbuild
// через cfg.tsconfig (.design-sync/tsconfig.bundle.json).
export { Button, buttonVariants } from "@/components/ui/button";
export { KindBadge } from "@/components/workshop/KindBadge";
export { ProseBody } from "@/components/reader/ProseBody";
export { GlitchText } from "@/components/haunted/GlitchText";
export { StoryOpening } from "@/components/haunted/StoryOpening";
export { WorkshopCard } from "@/components/workshop/WorkshopCard";
export { IllustrationPlate } from "@/components/reader/IllustrationPlate";
export { WheelIndex } from "@/components/wheel/WheelIndex";
