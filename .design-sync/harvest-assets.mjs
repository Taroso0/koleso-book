// Харвест стилей и шрифтов из next build для design-sync.
// Репозиторий — Next-приложение (Tailwind v4 CSS-first + next/font/google),
// поэтому «скомпилированный» CSS и self-host woff2 берём из .next после `npm run build`.
//
// Делает:
//  1. Конкатенирует продакшн-CSS из .next/static/chunks/*.css (токены + утилиты + @font-face).
//  2. Промоутит --font-prose/--font-system/--font-mono-accent с хэш-классов next/font (.___variable)
//     на :root — иначе var(--font-system) в утилитах/базе не резолвится вне <html> приложения.
//  3. Чистит CSS от служебного шума, который валидатор claude.ai/design (check_design_system)
//     ложно считает «токенами» (фикс — см. NOTES.md «Чистка CSS под токен-экстрактор»):
//       а) блок `@layer properties { … }` — legacy-фолбэк Tailwind v4: он инициализирует
//          `--tw-*` (translate/rotate/blur/enter-exit…) на универсальном селекторе ВНУТРИ
//          `@supports`, который таргетит только браузеры БЕЗ `@property`. Chromium и рантайм
//          claude.ai/design поддерживают `@property` (все `@property --tw-*` остаются в CSS и
//          несут initial-value), поэтому фолбэк там и так игнорируется — удаление пиксель-нейтрально,
//          но снимает ~27 «неклассифицируемых токенов» (служебные `--tw-*` — не тема-токены).
//       б) правила next/font вида `.<hash>__variable { --font-*: … }` — дубликаты: канонические
//          `--font-prose/system/mono-accent` уже промоутятся на :root шагом 2. Снимает ~24
//          «токена под компонентными селекторами».
//       в) удаляет объявления кастом-свойств из тел правил `:where(.<utility>…)` (Tailwind
//          `space-y-*` → `--tw-space-y-reverse:0`). Значение == `@property` initial (0) →
//          пиксель-нейтрально (var берёт initial, margin-* остаются). `:where()`-скоуп
//          permissive-скрейпер не принимает за валидный токен-скоуп → флагал их; здесь убираем.
//       г) помечает функциональные служебные переменные Tailwind/tw-animate (--tw-* и
//          --default-*) под ОДИНОЧНЫМИ классами комментарием `/* @kind other */` — они нужны
//          утилитам (трансформы/фильтры/leading/tracking/переходы) и компонентам, поэтому НЕ
//          удаляются, но это движок, а не тема-токены: по пометке валидатор исключает их из
//          набора токенов (одиночный класс-скоуп скрейпер принимает → пометки достаточно).
//     Авторские/семантические токены на :root (--sodium/--paper/--concrete/--monitor/--font-*,
//     shadcn-семантика, --color-*/--spacing/--radius из @theme) НЕ трогаются и классифицируются.
//  4. Переписывает url(../media/…) → url(./fonts/…) под раскладку бандла.
//  5. Копирует .next/static/media/*.woff2 → .design-sync/assets/fonts/.
//
// Выход (.design-sync/assets/) гитигнорится и регенерируется; для re-sync:
//   npm run build && node .design-sync/harvest-assets.mjs  (перед прогоном конвертера).
import fs from "node:fs";
import path from "node:path";

// Удаляет at-rule вместе со сбалансированным `{ … }`-телом (учитывает вложенность,
// например `@layer properties { @supports(…) { *,::before{…} } }`). marker — RegExp
// на заголовок правила (без `{`). Возвращает [очищенный css, число удалённых блоков].
function stripBalancedAtRule(css, marker) {
  let removed = 0;
  for (;;) {
    const m = css.match(marker);
    if (!m) break;
    const open = css.indexOf("{", m.index);
    if (open === -1) break;
    let depth = 0;
    let end = open;
    for (let i = open; i < css.length; i++) {
      const ch = css[i];
      if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) {
        end = i + 1;
        break;
      }
    }
    if (depth !== 0) break; // несбалансировано — не трогаем
    css = css.slice(0, m.index) + css.slice(end);
    removed++;
  }
  return [css, removed];
}

const repo = process.cwd();
const chunksDir = path.join(repo, ".next/static/chunks");
const mediaDir = path.join(repo, ".next/static/media");
const outDir = path.join(repo, ".design-sync/assets");
const fontsDir = path.join(outDir, "fonts");

fs.mkdirSync(fontsDir, { recursive: true });

// 1. Продакшн-CSS (один или несколько чанков; сейчас Turbopack кладёт один файл).
const cssFiles = fs
  .readdirSync(chunksDir)
  .filter((f) => f.endsWith(".css"))
  .sort();
if (cssFiles.length === 0) {
  throw new Error("нет скомпилированного CSS в .next/static/chunks — сначала `npm run build`");
}
let css = cssFiles
  .map((f) => fs.readFileSync(path.join(chunksDir, f), "utf8"))
  .join("\n");

// 2. Промоут font-переменных на :root (значения — стабильные имена семейств, не хэши).
const wanted = ["--font-prose", "--font-system", "--font-mono-accent"];
const promoted = [];
for (const name of wanted) {
  const m = css.match(new RegExp(name + "\\s*:\\s*([^;}]+)"));
  if (m) promoted.push(`${name}:${m[1].trim()}`);
}

// 3. Чистка служебного шума (после промоута — он читает значения из .__variable-классов).
//    3а. Весь блок @layer properties{…} (фолбэк Tailwind v4 для --tw-*; @property остаются).
let removedLayers = 0;
[css, removedLayers] = stripBalancedAtRule(css, /@layer\s+properties\b/);
//    3б. Хэш-классы next/font (.<name>__variable{…}) — дубликаты --font-* (уже на :root).
let removedFontClasses = 0;
css = css.replace(/\.[A-Za-z0-9_-]*__variable\s*\{[^{}]*\}/g, () => {
  removedFontClasses++;
  return "";
});
//    3в. Удаляем объявления кастом-свойств из тел правил :where(...) — это Tailwind-утилиты
//        (space-y → --tw-space-y-reverse:0), а НЕ тема-токены, и permissive-скрейпер сервера
//        флагает их как «переменные под утил-селекторами». Значение совпадает с `@property`
//        initial (0), поэтому удаление **пиксель-нейтрально**: var() берёт initial, а
//        функциональные margin-block-* в правиле остаются — space-y-* считает те же отступы.
//        (Сейчас в :where()-телах только нейтральные reverse-флаги; см. NOTES.)
let strippedWhereDecls = 0;
css = css.replace(/:where\([^{]*\)\s*\{[^{}]*\}/g, (rule) =>
  rule.replace(/--[A-Za-z][\w-]*\s*:\s*[^;{}]+;?/g, () => {
    strippedWhereDecls++;
    return "";
  })
);
//    3г. Помечаем служебные переменные Tailwind/tw-animate (--tw-* и --default-*)
//        комментарием `/* @kind other */`. Они функциональны (трансформы/фильтры/
//        spacing/leading/переходы — напр. .blur/.sepia/.-translate-x-1/2/.space-y-*/
//        .leading-prose), поэтому НЕ удаляем (иначе утилиты сломаются, fallback на
//        @property initial-value). Но это движок Tailwind, а не тема-токены: валидатор
//        claude.ai/design по этой пометке исключает их из набора токенов — снимает
//        и «переменные под утил-селекторами», и «неклассифицируемые». Канонические
//        токены (--sodium/--color-*/--spacing/--font-*/--radius) — другой префикс, не трогаются.
let kindTagged = 0;
css = css.replace(/(--(?:tw|default)-[A-Za-z0-9-]+\s*:\s*[^;{}]+)(?=[;}])/g, (_m, decl) => {
  kindTagged++;
  return decl + "/* @kind other */";
});

// 4. url(../media/…) → url(./fonts/…)
css = css.replace(/url\((['"]?)\.\.\/media\//g, "url($1./fonts/");

// 5. Допишем промоут-блок в конец (перебивает определения на хэш-классах).
if (promoted.length) css += `\n:root{${promoted.join(";")}}\n`;

fs.writeFileSync(path.join(outDir, "styles.css"), css);

// 5. Копируем self-host шрифты.
let n = 0;
for (const f of fs.readdirSync(mediaDir)) {
  if (f.endsWith(".woff2")) {
    fs.copyFileSync(path.join(mediaDir, f), path.join(fontsDir, f));
    n++;
  }
}

console.log(
  `harvest: styles.css ${css.length} б из [${cssFiles.join(", ")}]; ` +
    `promoted ${promoted.length} font-var (${promoted.map((p) => p.split(":")[0]).join(", ")}); ` +
    `stripped ${removedLayers} @layer properties + ${removedFontClasses} next/font class + ` +
    `${strippedWhereDecls} :where() decl; ` +
    `kind-tagged ${kindTagged} --tw-/--default- var; ` +
    `woff2 ${n}`
);
