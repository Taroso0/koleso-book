// Харвест стилей и шрифтов из next build для design-sync.
// Репозиторий — Next-приложение (Tailwind v4 CSS-first + next/font/google),
// поэтому «скомпилированный» CSS и self-host woff2 берём из .next после `npm run build`.
//
// Делает:
//  1. Конкатенирует продакшн-CSS из .next/static/chunks/*.css (токены + утилиты + @font-face).
//  2. Промоутит --font-prose/--font-system/--font-mono-accent с хэш-классов next/font (.___variable)
//     на :root — иначе var(--font-system) в утилитах/базе не резолвится вне <html> приложения.
//  3. Переписывает url(../media/…) → url(./fonts/…) под раскладку бандла.
//  4. Копирует .next/static/media/*.woff2 → .design-sync/assets/fonts/.
//
// Выход (.design-sync/assets/) гитигнорится и регенерируется; для re-sync:
//   npm run build && node .design-sync/harvest-assets.mjs  (перед прогоном конвертера).
import fs from "node:fs";
import path from "node:path";

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

// 3. url(../media/…) → url(./fonts/…)
css = css.replace(/url\((['"]?)\.\.\/media\//g, "url($1./fonts/");

// 4. Допишем промоут-блок в конец (перебивает определения на хэш-классах).
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
    `woff2 ${n}`
);
