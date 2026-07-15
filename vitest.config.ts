import { defineConfig } from "vitest/config";

// Тестовый раннер проекта (единственная среда — jsdom: чистая логика её не замечает,
// а компонентам/хукам «Читальни» и «Колеса» нужен DOM). JSX трансформирует oxc Vite
// (tsconfig jsx: react-jsx → automatic) — без Babel-плагина, чтобы не конфликтовать с
// @babel/core 7 из React Compiler / shadcn. Алиас @/* → корень: нативный резолв Vite
// по tsconfig (resolve.tsconfigPaths).
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov"],
      // Область измерения «90%»: слой логики/данных + интерактивные компоненты с
      // реальной логикой. Визуал/WebGL/анимации сюда НЕ входят (проверяются в браузере).
      include: [
        "lib/**/*.{ts,tsx}",
        "content/schema.ts",
        "content/themes.ts",
        "content/anchors.ts",
        "components/reader/reading.ts",
        "components/reader/ContinueReading.tsx",
        "components/wheel/readStories.ts",
        "components/wheel/WheelIndex.tsx",
        "components/motion/useReducedMotionSafe.ts",
        "components/motion/MotionProvider.tsx",
        "components/haunted/useHauntedCapability.ts",
      ],
      // next/font и next/og — билд-тайм-обёртки без логики, юнит-тестами не берутся.
      exclude: ["lib/fonts.ts", "lib/og.tsx"],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
