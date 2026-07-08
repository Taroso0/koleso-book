import { SystemLoader } from "@/components/haunted/SystemLoader";

// Suspense-фолбэк маршрута рассказа (грузит MDX) — главный дом «голоса загрузки» (§6).
export default function Loading() {
  return <SystemLoader label="Открываем рассказ" />;
}
