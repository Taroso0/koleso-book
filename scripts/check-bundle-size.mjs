// Гейт на вес страниц. Запускается после `npm run build` (в CI — отдельным шагом,
// локально — `npm run check:size`).
//
// Зачем. Бюджеты initial JS были записаны в docs (Шаг 6.2), но измерялись руками и
// только по случаю. За месяц «Читальня» выросла на 12-15 % и никто не заметил:
// документ без измерителя не защищает. Этот скрипт — измеритель.
//
// Метод — тот же, что был зафиксирован на Шаге 6.2, чтобы числа оставались сравнимыми:
// сумма УНИКАЛЬНЫХ `<script src="/_next/...">` в пререндеренном HTML маршрута,
// в несжатых байтах. По сети gzip ≈ ÷3.
//
// ПОРОГИ — «храповик», а не мечта. Стоят на ~2,5 % выше сегодняшнего факта: задача
// гейта — не дать весу вырасти незаметно, а не заставить сразу похудеть. Новый тяжёлый
// импорт — это +100 КБ и больше, он в запас не влезет; шум от пересборки — единицы КБ,
// он гейт не дёргает.
//
// Когда вес осознанно снижают (например, убрав three.js из GrainCanvas) — потолок
// опускают ТЕМ ЖЕ коммитом. Когда осознанно растят — поднимают тем же коммитом и
// объясняют в сообщении. Целевые числа (мечта), история и таблица порогов — в docs/решения.md.

import fs from "node:fs";
import path from "node:path";

const APP = path.join(".next", "server", "app");
const NEXT = ".next";

// Порядок важен: первое совпадение выигрывает. Маршрут → потолок в КБ (raw).
// Факт на 2026-07-21 указан рядом, чтобы был виден запас без прогона.
const BUDGETS = [
  { route: "/", re: /^\/index\.html$/, limit: 985 }, //                    факт 960
  { route: "/contacts", re: /^\/contacts\.html$/, limit: 975 }, //         факт 952
  { route: "/workshop/[entry]", re: /^\/workshop\/[^/]+\.html$/, limit: 990 }, // 966
  { route: "/workshop", re: /^\/workshop\.html$/, limit: 990 }, //         факт 968
  { route: "/read/[book]/[story]", re: /^\/read\/[^/]+\/[^/]+\.html$/, limit: 855 }, // 830
  { route: "/read/[book]", re: /^\/read\/[^/]+\.html$/, limit: 835 }, //   факт 808
  { route: "/read", re: /^\/read\.html$/, limit: 835 }, //                 факт 811
  { route: "служебные", re: /^\/_/, limit: 825 }, //                       факт 799
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

function scriptBytes(html) {
  const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((s) => s.startsWith("/_next/"));
  let total = 0;
  let n = 0;
  for (const s of new Set(srcs)) {
    // /_next/static/... → .next/static/...
    try {
      total += fs.statSync(path.join(NEXT, s.slice("/_next/".length))).size;
      n++;
    } catch {
      // чанк не найден на диске — молча пропускать нельзя, это дыра в замере
      console.error(`  ! чанк не найден на диске: ${s}`);
      process.exitCode = 1;
    }
  }
  return { kb: Math.round(total / 1024), chunks: n };
}

if (!fs.existsSync(APP)) {
  console.error(`Нет ${APP} — сначала выполните: npm run build`);
  process.exit(1);
}

// Внутри группы маршрута берём САМУЮ ТЯЖЁЛУЮ страницу: 34 рассказа отличаются
// только контентом, но правило должно ловить худший случай, а не средний.
const worst = new Map();
for (const file of walk(APP).filter((f) => f.endsWith(".html"))) {
  const rel = "/" + path.relative(APP, file).split(path.sep).join("/");
  const rule = BUDGETS.find((b) => b.re.test(rel));
  if (!rule) {
    console.error(`  ! страница вне бюджетов: ${rel} — добавьте правило в BUDGETS`);
    process.exitCode = 1;
    continue;
  }
  const { kb, chunks } = scriptBytes(fs.readFileSync(file, "utf8"));
  const prev = worst.get(rule.route);
  if (!prev || kb > prev.kb) worst.set(rule.route, { kb, chunks, rule, rel });
}

console.log("\nВес initial JS по маршрутам (несжато; по сети gzip ≈ ÷3)\n");
console.log(
  "маршрут".padEnd(24) + "чанков".padStart(7) + "факт".padStart(9) + "потолок".padStart(10) + "  запас",
);
console.log("─".repeat(62));

let failed = 0;
for (const { route, limit } of BUDGETS) {
  const m = worst.get(route);
  if (!m) continue;
  const over = m.kb > limit;
  if (over) failed++;
  const slack = limit - m.kb;
  const mark = over ? "  ✗ ПРЕВЫШЕН" : `  ${slack} КБ`;
  console.log(
    route.padEnd(24) +
      String(m.chunks).padStart(7) +
      `${m.kb} КБ`.padStart(9) +
      `${limit} КБ`.padStart(10) +
      mark,
  );
}
console.log("─".repeat(62));

if (failed > 0) {
  console.error(
    `\n✗ Превышен бюджет у ${failed} маршрут(ов).\n` +
      "  Обычная причина — новый тяжёлый импорт, не попавший в ленивый остров\n" +
      "  (next/dynamic ssr:false). Проверьте, что добавилось в initial-чанки.\n" +
      "  Если рост осознанный — поднимите потолок в scripts/check-bundle-size.mjs\n" +
      "  тем же коммитом и объясните в сообщении, почему.\n",
  );
  process.exit(1);
}

if (process.exitCode) {
  console.error("\n✗ Замер неполон — см. предупреждения выше.\n");
  process.exit(1);
}

console.log("\n✓ Все маршруты в бюджете.\n");
