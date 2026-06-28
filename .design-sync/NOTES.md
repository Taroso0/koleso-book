# design-sync — заметки по репозиторию «Боковым зрением» (kirilov)

Проект на claude.ai/design: **e0f3243c-8da7-432f-82c9-fabc7c616e25** (`Боковым зрением — дизайн-система`).

## Чем этот репозиторий нестандартен

- Это **Next.js-приложение** (App Router, Next 16 / Turbopack), а НЕ упакованная дизайн-система:
  нет `dist`, нет `exports`, `package.json` `private`. Поэтому package-shape с **synth-entry**:
  `--entry ./.design-sync/entry.tsx` (реэкспортирует компоненты из `components/*`).
- Глобал бандла нормализуется в **`window.Kirilov`** (с заглавной).

## Что синхронизируется (8 компонентов)

Группа в DS = папка-источник под `components/`:
- **general**: `Button` (`components/ui/button.tsx`) — Radix Slot.
- **workshop**: `KindBadge`, `WorkshopCard`.
- **reader**: `ProseBody`, `IllustrationPlate`.
- **haunted**: `GlitchText`, `StoryOpening` (motion/react, gsap; провайдер НЕ нужен —
  `useReducedMotionSafe` падает в ОС-фолбэк без `<MotionProvider>`).
- **wheel**: `WheelIndex`.

**НЕ синхронизируемо** (осознанно вне синка — не рендерятся изолированно/достоверно):
- `BookSwitcher` — `getBooks()` читает `node:fs`/`process.cwd()` в рантайме (несовместимо с браузером).
- `ReduceMotionToggle` — требует `<MotionProvider>` (`useMotionPreference` бросает исключение).
- `ContinueReading` — localStorage; без данных рендерит `null`.
- `WheelGraph`/`WheelCanvas` (d3-force остров, `next/dynamic ssr:false`), `GrainCanvas` (three/WebGL),
  `GrainOverlay`/`FogReveal`/`CustomCursor` (full-viewport canvas/overlay), `SmoothScroll` (Lenis),
  `ReaderShell`/`Reader` (page-острова), провайдеры/хуки/утилиты (`MotionProvider`, `ZachinProvider`,
  `useReducedMotionSafe`, `useIsoLayoutEffect`, `useHauntedCapability`, `zachinContext`, `reading.ts`).
  Чтобы добавить любой из них — нужен реальный изоляционный сценарий (данные/провайдер/без WebGL).

## Шим Next-рантайма (next/link, next/image) — для редакционных компонентов

`WorkshopCard`/`WheelIndex` импортируют `next/link`, `WorkshopCard`/`IllustrationPlate` — `next/image`.
Бандлер esbuild инлайнит ВСЁ из node_modules (externals — только react-семейство), поэтому реальные
`next/link`/`next/image` затягивают Next-рантайм и в standalone-бандле падают: **`ReferenceError:
process is not defined`** (несколько `process.env.__NEXT_*` без `typeof`-guard) — и это валит ВЕСЬ IIFE,
т.е. даже Button становится «root empty». Решение:
- `.design-sync/shims/next-link.tsx` → `<a href {…}>`; `.design-sync/shims/next-image.tsx` → `<img>`
  (отбрасывают next-специфичные пропы; вёрстка достоверна, теряется только оптимизация/префетч).
- `.design-sync/tsconfig.bundle.json` инлайнит `compilerOptions.paths`: `@/*`, `next/link`, `next/image`
  → шимы. `cfg.tsconfig` указывает на него. Реальный `tsconfig.json` приложения НЕ трогаем.

⚠️ **КРИТИЧЕСКАЯ ГОЧА (tsconfig-JSON-комментарии).** `tsconfigPathsPlugin` (lib/bundle.mjs) перед
`JSON.parse` грубо вырезает `//`-комментарии регэкспом `(^|[^:])//.*$`. JSON-**ключ** `"//": "…"`
он искалечит (символ перед `//` — кавычка, не `:`) → `JSON.parse` бросает → плагин возвращает `null` →
paths НЕ применяются → esbuild берёт esbuild-автоподхват корневого `tsconfig.json` (только `@/*`,
без `next/*`) → реальные next/link/image в бандле → крах. **`tsconfig.bundle.json` держать чистым
JSON, без комментариев ни в каком виде.** (Признак, что шим НЕ сработал: bundle ~1MB и `process.env.__NEXT_*`
в `_ds_bundle.js`; со шимом ~742KB.)

esbuild JSX-режим берётся из АВТОПОДХВАТА корневого `tsconfig.json` (`jsx: react-jsx`), а не из
`cfg.tsconfig` (тот идёт только в pathsPlugin) — имя `tsconfig.bundle.json` специально не `tsconfig.json`.

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
  суперсет: вкл. reading-темы и lenis; намеренно, несёт полный набор токенов light/dark).
- `.design-sync/assets/` гитигнорится и регенерируется (не коммитим woff2/CSS).

## Контракт API (`dtsPropsFor` — все 8 вручную)

- В synth-режиме (без dist `.d.ts`) ts-morph НЕ резолвит inline-типы с импортами (`VariantProps`,
  доменные типы `WorkshopEntry`/`Illustration`/`WheelGraph`) → пропы выходят пустыми. Поэтому тело
  интерфейса каждого из 8 задано вручную в **`cfg.dtsPropsFor.<Name>`**.
- Рассинхрон с исходником ловится только глазами: при правке вариантов/размеров `button.tsx` или
  пропов любого компонента — обновить соответствующий `dtsPropsFor.<Name>`.

## Guidelines

- `cfg.guidelinesGlob` сужен до `["docs/концепция.md"]`. Остальные `docs/*.md`
  (`тех-спецификация`, `отложенное`, `проверка-в-браузере`, `proofreading-checklist`) —
  внутренние, НЕ дизайн-гайдлайны; в DS-проект не грузим.

## Превью

- `.design-sync/previews/<Name>.tsx` — авторские (8), импорт из `"kirilov"` (Rule 1 шимит на
  `window.Kirilov.<Name>`). Импорт через `@/components/...` в превью НЕ использовать.
- Имена ячеек — латиницей с заглавной (`/^[A-Z]/`): кириллические экспорты не станут ячейками.
- **Детерминизм motion в превью** (package-capture НЕ глушит анимации и НЕ эмулирует reduced-motion —
  только `networkidle`+fonts/decode): `GlitchText` рендерим `play={false}` (чистый текст);
  `StoryOpening` (GSAP entrance ~0.5с) успевает осесть до кадра — кадр чистый. Если будущий капчер
  поймает «бледный» зачин — обернуть в провайдер reduced или показать статически.
- Редакционные превью используют синтетику: `WorkshopCard` — текстовые entry без картинки;
  `IllustrationPlate` — `src` = data-URI SVG (демо-плейсхолдер); `WheelIndex` — фикс-граф литералом
  (демо-данные, не канон).

## Гочи окружения

- Конвертер запускать **из `D:\Колесо`**. Не оставлять cwd шелла внутри `ds-bundle` —
  при ребилде `rmSync(ds-bundle)` даёт `EPERM` (Windows блокирует cwd-директорию).
  Bash и PowerShell делят cwd в этой сессии.

## Re-sync risks (на что смотреть в следующий синк)

- **Ассеты регенерируются.** На свежем клоне: `npm ci`, затем `cfg.buildCmd` (build+harvest)
  до конвертера; иначе `cfg.cssEntry` не существует.
- **Харвест предполагает ОДИН продакшн-CSS-чанк** в `.next/static/chunks/*.css`. Если чанков станет
  несколько — проверить порядок конкатенации в `harvest-assets.mjs` (каскад).
- **Шим Next хрупок к версии Next:** если `next/link`/`next/image` сменят внутренний API/имя поддиры,
  достаточно проверить, что бандл ~742KB и в `_ds_bundle.js` НЕТ `process.env.__NEXT_*`. Если
  редакционный компонент начнёт импортировать ещё какой-то `next/*` (напр. `next/navigation`) —
  добавить шим и путь в `tsconfig.bundle.json`.
- **`tsconfig.bundle.json` — только чистый JSON** (см. критическую гочу выше).
- **dtsPropsFor — ручной для всех 8**: рассинхрон с исходниками ловится глазами.
- **Синтетика в превью** (entry/illustration/graph, data-URI картинка) может разойтись с реальными
  типами при правке схем — превью просто перестанут собираться (видно в build-логе).
- **woff2-хэши** next/font контентно-стабильны; имя CSS-чанка хэшируется — харвест глоббит по маске.

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

Затем: заграйдить `verification.pendingGrade` (читать листы `_screenshots/review/*.png`, писать
`.design-sync/.cache/review/<Name>.grade.json`); прогнать conventions-шаг (валидация имён +
дописать новые компоненты); если менялся header — ребилд драйвером; если `upload.any` — атомарный
upload (sentinel → full writes → deletes дословно из `upload.deletePaths` → sentinel re-arm →
`_ds_sync.json` последним). Не оставлять cwd шелла внутри `ds-bundle`.

## Known render warns

- `tokens: … (1 missing, below threshold)` — НЕ блокирует (`validate` exit 0). Один `var(--token)`
  без определения в шипнутом CSS, ниже порога. Если порог превысит — глянуть `[TOKENS_MISSING]`.
- render-check 8/8 чисто; `bad/thin/variantsIdentical = 0`.
