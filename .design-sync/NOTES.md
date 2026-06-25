# design-sync — заметки по репозиторию «Боковым зрением» (kirilov)

Проект на claude.ai/design: **e0f3243c-8da7-432f-82c9-fabc7c616e25** (`Боковым зрением — дизайн-система`).

## Чем этот репозиторий нестандартен

- Это **Next.js-приложение** (App Router, Next 16 / Turbopack), а НЕ упакованная дизайн-система:
  нет `dist`, нет `exports`, `package.json` `private`. Поэтому package-shape с **synth-entry**:
  `--entry ./.design-sync/entry.tsx` (реэкспортирует `Button` из `components/ui/button.tsx`).
  Алиас `@/* → ./*` резолвится esbuild через `cfg.tsconfig`.
- В `components/ui` пока **один** компонент — `Button`. Остальное (`wheel/`, `reader/`, `haunted/`,
  `motion/`) — тяжёлые app-острова/провайдеры, осознанно вне синка.
- Глобал бандла нормализуется в **`window.Kirilov`** (с заглавной).

## CSS и шрифты требуют `next build` + харвест (ключевое)

- `app/globals.css` — это **исходник Tailwind v4** (`@import "tailwindcss"`, `@theme`, `@apply`),
  а не готовый CSS. Шрифты — `next/font/google` (Source Serif 4 / Inter / JetBrains Mono),
  self-host woff2 генерируются при сборке в `.next/static/media`.
- Поэтому перед конвертером нужно: **`npm run build && node .design-sync/harvest-assets.mjs`**
  (именно это в `cfg.buildCmd`). Харвест:
  1. конкатенирует продакшн-CSS из `.next/static/chunks/*.css` (токены + утилиты + `@font-face`);
  2. промоутит `--font-prose/--font-system/--font-mono-accent` с хэш-классов next/font на `:root`
     (иначе `var(--font-system)` не резолвится вне `<html>` приложения);
  3. переписывает `url(../media/…)` → `url(./fonts/…)`, копирует woff2 в `.design-sync/assets/fonts/`.
- `cfg.cssEntry` → `.design-sync/assets/styles.css` (весь скомпилированный CSS приложения —
  суперсет: вкл. reading-темы и lenis; это намеренно, несёт полный набор токенов light/dark).
- `.design-sync/assets/` гитигнорится и регенерируется (не коммитим woff2/CSS).

## Контракт API (`Button.d.ts`)

- В synth-режиме (без dist `.d.ts`) ts-morph НЕ разрезолвил `VariantProps<typeof buttonVariants>` →
  пропы выходили пустыми (`[key: string]: unknown`). Поэтому тело интерфейса задано вручную в
  **`cfg.dtsPropsFor.Button`** (variant/size/asChild + базовые button-пропы).
  Если в `button.tsx` поменяются варианты/размеры — обновить `dtsPropsFor.Button`.

## Guidelines

- `cfg.guidelinesGlob` сужен до `["docs/концепция.md"]`. Остальные `docs/*.md`
  (`тех-спецификация`, `отложенное`, `проверка-в-браузере`, `proofreading-checklist`) —
  внутренние, НЕ дизайн-гайдлайны; в DS-проект не грузим.

## Превью

- `.design-sync/previews/Button.tsx` — авторская, импорт из `"kirilov"` (Rule 1 шимит на
  `window.Kirilov.Button`). Импорт через `@/components/ui/button` НЕ использовать: имя файла
  `button.tsx` в нижнем регистре не совпадёт с экспортом `Button` → удвоит бандл.
- Имена ячеек — латиницей с заглавной (`/^[A-Z]/`): кириллические экспорты не станут ячейками.

## Гочи окружения

- Конвертер запускать **из `D:\Колесо`**. Не оставлять cwd шелла внутри `ds-bundle` —
  при ребилде `rmSync(ds-bundle)` даёт `EPERM` (Windows блокирует cwd-директорию).
  Bash и PowerShell делят cwd в этой сессии.

## Re-sync risks (на что смотреть в следующий синк)

- **Ассеты регенерируются.** На свежем клоне: `npm ci`, затем `cfg.buildCmd` (build+harvest)
  до конвертера; иначе `cfg.cssEntry` не существует.
- **Харвест предполагает ОДИН продакшн-CSS-чанк** в `.next/static/chunks/*.css` (сейчас Turbopack
  кладёт один файл). Если приложение разрастётся и чанков станет несколько — проверить
  порядок конкатенации в `harvest-assets.mjs` (каскад).
- **woff2-хэши** next/font контентно-стабильны, но имя CSS-чанка хэшируется — харвест глоббит
  по маске, не по имени (ок).
- **`dtsPropsFor.Button` — ручной**: рассинхрон с `button.tsx` ловится только глазами.

## Re-sync (команды)

Драйвер `resync.mjs` запускает конвертер, но НЕ `cfg.buildCmd` — `next build`+харвест нужно
прогнать руками ДО драйвера. Из `D:\Колесо`:

```sh
# 1. свежий клон: npm ci; и заново застейджить конвертер:
#    cp -r <skill>/{package-build,package-validate,package-capture,resync}.mjs <skill>/lib <skill>/storybook .ds-sync/
#    npm i --prefix .ds-sync esbuild ts-morph @types/react playwright
# 2. собрать стили/шрифты (cfg.buildCmd):
npm run build && node .design-sync/harvest-assets.mjs
# 3. забрать якорь проекта: DesignSync get_file _ds_sync.json → .design-sync/.cache/remote-sync.json
# 4. прогнать драйвер:
node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules \
  --entry ./.design-sync/entry.tsx --out ./ds-bundle --remote .design-sync/.cache/remote-sync.json
```

Затем: заграйдить `verification.pendingGrade`, и если `upload.any` — выгрузить (full writes,
`deletePaths` дословно из вердикта). Не оставлять cwd шелла внутри `ds-bundle`.

## Known render warns

- Нет (render-check на Button прошёл чисто с первого раза; `bad/thin/variantsIdentical` = false).
