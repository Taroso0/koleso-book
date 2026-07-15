#!/usr/bin/env node
// Снимок ОДНОЙ части сайта — надёжен для состояний «ниже сгиба» на Витрине, где
// инерционный скролл Lenis откатывает программный scroll и обычный вьюпорт-снимок
// падает на hero. Element-screenshot захватывает сам элемент независимо от скролла.
//
// ГЛАВНОЕ: есть КАТАЛОГ частей сайта (PARTS ниже). Вместо угадывания селектора —
// `--part <имя>`: скрипт сам откроет нужную страницу и снимет верный элемент
// с первого раза. `--list` печатает всю карту. Ad-hoc селектор — через `--selector`.
//
// Playwright/chromium — из .ds-sync (как в screenshot.mjs). Dev-сервер должен работать.
//
// Запуск из корня проекта:
//   node .claude/skills/verify-in-browser/element-shot.mjs --list
//   node .claude/skills/verify-in-browser/element-shot.mjs --part wheel-index
//   node .claude/skills/verify-in-browser/element-shot.mjs --selector '<css>' [опции]
// Опции:
//   --part <имя>         часть сайта из каталога (см. --list) — задаёт url+селектор
//   --list               напечатать карту частей сайта и выйти
//   --selector '<css>'   ЧТО снять ad-hoc, напр. 'nav[aria-labelledby="wheel-heading"]'
//   --url /path          страница (по умолчанию /); для --part берётся из каталога
//   --click '<css>'      кликнуть по элементу перед снимком (раскрыть <details>,
//                        открыть меню и т.п.) — можно повторять, кликает по очереди
//   --focus '<css>'      сфокусировать элемент перед снимком (живое внимание/hover-паритет)
//   --name <имя>         имя файла без .png (по умолчанию из --part/--selector)
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

// ── Каталог частей сайта ───────────────────────────────────────────────────
// url — страница ('/', '/workshop', … или ':story' = первый рассказ с /read).
// selector — устойчивый landmark/id (менять при рефакторинге разметки, поэтому
// сверяйся с кодом, если снимок пуст). desktopOnly — остров только для ≥1024px
// (на --mobile спрятан display:none). Порядок ≈ порядок на странице.
const PARTS = {
  // ── Главная / Витрина (/) ──
  'hero':           { url: '/', selector: '.warm-hero',                         note: 'Первый экран «Тёплое окно» (h1, горящее окно, тизер Колеса)' },
  'wheel-graph':    { url: '/', selector: '[aria-label="Колесо тем"]', desktopOnly: true, note: 'Визуальный граф «Колеса» (d3-force + SVG)' },
  'wheel-index':    { url: '/', selector: 'nav[aria-labelledby="wheel-heading"]', note: 'Доступный список «тема → рассказы» — КАНОН навигации (свёрнутые details)' },
  'author':         { url: '/', selector: '#author',                            note: 'Тизер-секция «Автор»' },
  'books':          { url: '/', selector: '#books',                             note: 'Секция «Книги» (карточки в Читальню)' },
  'workshop-teaser':{ url: '/', selector: '#workshop',                          note: 'Тизер-секция «Мастерская» на главной' },
  'home-footer':    { url: '/', selector: 'main#main footer',                   note: 'Подвал главной: «Войти в Читальню» + тумблер «снизить эффекты» + Контакты' },
  // ── Мастерская (/workshop) ──
  'workshop':       { url: '/workshop', selector: 'main#main',                  note: 'Лента записей Мастерской (3-я книга building-in-public)' },
  // ── Контакты (/contacts) ──
  'contacts':       { url: '/contacts', selector: 'main#main',                  note: 'Тихий финал: прощание + контакты в ночной палитре' },
  // ── Читальня — оглавление (/read) ──
  'read-index':     { url: '/read', selector: 'main#main',                      note: 'Оглавление Читальни: книги и их рассказы' },
  // ── Читальня — рассказ (/read/<книга>/<рассказ>) ──
  'reader':         { url: ':story', selector: 'main#main',                     note: 'Страница рассказа целиком (шапка + текст + навигация)' },
  'reader-toolbar': { url: ':story', selector: '[role="toolbar"][aria-label="Настройки чтения"]', note: 'Панель настроек чтения (темы, размер, реж. без эффектов)' },
  'story-article':  { url: ':story', selector: 'article',                       note: 'Тело рассказа (типографика прозы, плашки-иллюстрации)' },
};

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const argAll = (name) => argv.reduce((acc, v, i) => (v === name && argv[i + 1] ? [...acc, argv[i + 1]] : acc), []);
const has = (name) => argv.includes(name);

// ── --list: печать карты и выход ──
if (has('--list')) {
  const rows = Object.entries(PARTS);
  const pad = Math.max(...rows.map(([k]) => k.length));
  console.log('Карта частей сайта (--part <имя>):\n');
  let lastUrl = null;
  for (const [name, p] of rows) {
    if (p.url !== lastUrl) { console.log(`  [${p.url}]`); lastUrl = p.url; }
    const flag = p.desktopOnly ? ' (только десктоп)' : '';
    console.log(`    ${name.padEnd(pad)}  ${p.note}${flag}`);
  }
  console.log('\n  :story = первый рассказ, найденный на /read.');
  console.log('\nПример: node .claude/skills/verify-in-browser/element-shot.mjs --part wheel-index');
  console.log('Раскрыть тему перед снимком:  --part wheel-index --click \'summary:has(#theme-death)\' --name wheel-death-open');
  process.exit(0);
}

const PART = arg('--part', '');
if (PART && !PARTS[PART]) {
  console.error(`Неизвестная часть «${PART}». Список: node .claude/skills/verify-in-browser/element-shot.mjs --list`);
  process.exit(2);
}
const partDef = PART ? PARTS[PART] : null;

const SELECTOR = partDef ? partDef.selector : arg('--selector', '');
if (!SELECTOR) {
  console.error('Нужен --part <имя> (см. --list) или --selector \'<css>\'.');
  process.exit(2);
}
const BASE = arg('--base', 'http://localhost:3000');
const URL_PATH = arg('--url', partDef ? partDef.url : '/');
const FOCUS = arg('--focus', '');
const CLICKS = argAll('--click');
const SETTLE = Number(arg('--settle', '1200'));
const NAME = arg('--name', PART || SELECTOR.replace(/[^\wа-яё-]+/gi, '_').slice(0, 40) || 'element');

const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
const OUT = path.join(os.tmpdir(), 'koleso-verify', stamp);
mkdirSync(OUT, { recursive: true });

// :story → первый рассказ вида /read/<book>/<story> с оглавления Читальни.
async function resolveUrl(browser, urlPath) {
  if (urlPath !== ':story') return urlPath;
  const page = await browser.newPage();
  try {
    await page.goto(BASE + '/read', { waitUntil: 'load', timeout: 30000 });
    const href = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="/read/"]')]
        .map((el) => el.getAttribute('href'))
        .find((h) => /^\/read\/[^/]+\/[^/]+$/.test(h || '')) || null,
    );
    if (!href) throw new Error('на /read не найдена ссылка на рассказ');
    return href;
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: has('--mobile') ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  reducedMotion: has('--reduced') ? 'reduce' : 'no-preference',
});
const page = await ctx.newPage();
const file = path.join(OUT, `${NAME}.png`);
let status = 0;
try {
  if (partDef?.desktopOnly && has('--mobile')) {
    console.log(`«${PART}» — только десктоп; на --mobile спрятан. Снимок не делаю.`);
    status = 1;
  } else {
    const urlPath = await resolveUrl(browser, URL_PATH);
    await page.goto(BASE + urlPath, { waitUntil: 'load', timeout: 45000 });
    // Клики (раскрыть <details>, открыть меню) — до захвата.
    for (const sel of CLICKS) {
      await page.locator(sel).first().click({ timeout: 5000 });
      await page.waitForTimeout(350);
    }
    const el = page.locator(SELECTOR).first();
    // Дать клиентским островам смонтироваться: часть UI (панель настроек чтения и т.п.)
    // рендерится только после mount, на событии `load` её ещё нет в DOM. Ждём появления;
    // для честно скрытых (десктоп-остров на мобильном) — таймаут, дальше сообщим штатно.
    await el.waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
    // Проверяем ВИДИМОСТЬ, а не наличие: десктоп-острова (граф «Колеса») на мобильном
    // не удаляются из DOM, а прячутся `display:none` (`hidden lg:block`) — count()=1, но
    // снимать нечего. Элемент ниже сгиба (display:block) при этом isVisible()=true.
    if (!(await el.count()) || !(await el.isVisible())) {
      console.log(`НЕ ВИДЕН ${SELECTOR} на ${urlPath} (${has('--mobile') ? 'мобильный' : 'десктоп'}) — скрыт или отсутствует. Снимок не сделан.`);
      if (PART) console.log('Если часть переехала — сверь селектор с кодом (разметка страницы).');
      status = 1;
    } else {
      await el.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(SETTLE);
      if (FOCUS) {
        await page.locator(FOCUS).first().focus();
        await page.waitForTimeout(600); // осадка перехода состояния
      }
      await el.screenshot({ path: file }); // element-screenshot — не зависит от Lenis
      const extra = [CLICKS.length && `click: ${CLICKS.join(', ')}`, FOCUS && `focus: ${FOCUS}`].filter(Boolean).join('; ');
      console.log(`OK → ${file}${extra ? `  (${extra})` : ''}`);
    }
  }
} catch (e) {
  console.error(`FAIL ${SELECTOR} — ${String(e).split('\n')[0]}`);
  status = 1;
} finally {
  await ctx.close();
  await browser.close();
}
process.exit(status);
