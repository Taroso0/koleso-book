import type { NextConfig } from "next";

// §10 — производительность. Контент статичен (SSG); тяжёлые острова грузятся лениво
// через next/dynamic (three — GrainCanvas; граф+d3-force — WheelGraph), здесь их не
// конфигурируем. Здесь: AVIF-картинки и React Compiler.
const nextConfig: NextConfig = {
  // React Compiler (§10): автомемоизация клиентских островов → меньше ререндеров (INP),
  // прежде всего «Колесо» (hover/focus-стейт). Прогон — через Babel-пасс (медленнее сборка).
  reactCompiler: true,

  images: {
    // AVIF (легче WebP) — плашки Кучеренко главный вес страницы рассказа (LCP).
    formats: ["image/avif", "image/webp"],
    // Плашки рендерятся ≤ 24rem (~384px), мобильный 90vw ≤ ~576px → не генерируем
    // огромные 1920/2048/3840 (по умолчанию). Узкий набор кандидатов srcset.
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [256, 384],
  },
};

export default nextConfig;
