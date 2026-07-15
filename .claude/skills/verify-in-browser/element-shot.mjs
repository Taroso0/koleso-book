#!/usr/bin/env node
// Снимок ОДНОГО элемента — надёжен для состояний «ниже сгиба» на Витрине, где
// инерционный скролл Lenis откатывает программный scroll и обычный вьюпорт-снимок
// падает на hero. Element-screenshot захватывает сам элемент независимо от скролла.
// Опц. --focus задаёт «живое внимание» ФОКУСОМ (он липкий и переживает доскролл
// при захвате — в отличие от hover, который теряется на mouseleave).
//
// Playwright/chromium — из .ds-sync (как в screenshot.mjs). Dev-сервер должен работать.
//
// Запуск из корня проекта:
//   node .claude/skills/verify-in-browser/element-shot.mjs --selector '<css>' [опции]
// Опции:
//   --selector '<css>'   ЧТО снять (обязательно), напр. '[aria-label="Колесо тем"]'
//   --url /path          страница (по умолчанию /)
//   --focus '<css>'      сфокусировать элемент перед снимком (живое внимание/hover-паритет)
//   --name <имя>         имя файла без .png (по умолчанию из --selector)
//   --reduced            эмулировать prefers-reduced-motion: reduce
//   --mobile             вьюпорт 390×844 (по умолчанию десктоп 1440×900)
//   --settle <мс>        пауза после загрузки (по умолчанию 1200)
//   --base <url>         база dev-сервера (по умолчанию http://localhost:3000)

import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

// Cyrillic-safe: путь до .ds-sync строится от URL самого скрипта.
const dsRequire = createRequire(new URL('../../../.ds-sync/package.json', import.meta.url));
const { chromium } = dsRequire('playwright');

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const has = (name) => argv.includes(name);

const SELECTOR = arg('--selector', '');
if (!SELECTOR) {
  console.error('Нужен --selector \'<css>\' — что снимать. Пример: --selector \'[aria-label="Колесо тем"]\'');
  process.exit(2);
}
const BASE = arg('--base', 'http://localhost:3000');
const URL_PATH = arg('--url', '/');
const FOCUS = arg('--focus', '');
const SETTLE = Number(arg('--settle', '1200'));
const NAME = arg('--name', SELECTOR.replace(/[^\wа-яё-]+/gi, '_').slice(0, 40) || 'element');

const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
const OUT = path.join(os.tmpdir(), 'koleso-verify', stamp);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: has('--mobile') ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  reducedMotion: has('--reduced') ? 'reduce' : 'no-preference',
});
const page = await ctx.newPage();
const file = path.join(OUT, `${NAME}.png`);
let status = 0;
try {
  await page.goto(BASE + URL_PATH, { waitUntil: 'load', timeout: 45000 });
  const el = page.locator(SELECTOR).first();
  // Проверяем ВИДИМОСТЬ, а не наличие: десктоп-острова (граф «Колеса») на мобильном
  // не удаляются из DOM, а прячутся `display:none` (`hidden lg:block`) — count()=1, но
  // снимать нечего. Элемент ниже сгиба (display:block) при этом isVisible()=true.
  if (!(await el.count()) || !(await el.isVisible())) {
    console.log(`НЕ ВИДЕН ${SELECTOR} на ${URL_PATH} (${has('--mobile') ? 'мобильный' : 'десктоп'}) — скрыт или отсутствует. Снимок не сделан.`);
    status = 1;
  } else {
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(SETTLE);
    if (FOCUS) {
      await page.locator(FOCUS).first().focus();
      await page.waitForTimeout(600); // осадка перехода состояния
    }
    await el.screenshot({ path: file }); // element-screenshot — не зависит от Lenis
    console.log(`OK → ${file}${FOCUS ? `  (focus: ${FOCUS})` : ''}`);
  }
} catch (e) {
  console.error(`FAIL ${SELECTOR} — ${String(e).split('\n')[0]}`);
  status = 1;
} finally {
  await ctx.close();
  await browser.close();
}
process.exit(status);
