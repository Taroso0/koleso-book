// Synth-entry для design-sync (репозиторий — Next-приложение без сборки библиотеки).
// Реэкспортирует переиспользуемые примитивы из components/ui для бандла window.kirilov.
// Алиас @/* → ./* резолвится esbuild через cfg.tsconfig.
export { Button, buttonVariants } from "@/components/ui/button";
