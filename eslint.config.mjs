import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Не рантайм-код: сгенерированный экспорт дизайн-системы, его тулчейн и отчёт
    // покрытия. Все три в .gitignore, но flat-config ESLint 9 его не читает (нужен
    // @eslint/compat/includeIgnoreFile) — перечисляем явно, иначе `npm run lint`
    // тонет в ~1850 проблем из минифицированного бандла.
    "ds-bundle/**",
    ".ds-sync/**",
    ".design-sync/.cache/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
