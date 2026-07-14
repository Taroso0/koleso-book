#!/usr/bin/env node
// Скриншоты ключевых состояний сайта для визуальной верификации.
// Playwright берётся из .ds-sync/node_modules (там же живёт установленный
// chromium — кэш %LOCALAPPDATA%\ms-playwright). Dev-сервер должен уже работать.
//
// Запуск из корня проекта:
//   node .claude/skills/verify-in-browser/screenshot.mjs [--base http://localhost:3000] [--only home,story]
//
// Снимки кладутся в %TEMP%\koleso-verify\<HHmmss>\ и печатаются списком —
// дальше их смотрят инструментом Read.

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
const BASE = arg('--base', 'http://localhost:3000');
const ONLY = arg('--only', '').split(',').map((s) => s.trim()).filter(Boolean);

const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
const OUT = path.join(os.tmpdir(), 'koleso-verify', stamp);
mkdirSync(OUT, { recursive: true });

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

// Каждое состояние: имя файла, url (или fn для динамических),
// опции контекста (viewport, colorScheme, reducedMotion, readingTheme)
// и режим ожидания ('settle' — load+пауза; 'flash' — кадр сразу после commit,
// ловит вспышку темы на F5).
const STATES = [
  { name: 'home', url: '/' },
  { name: 'home-reduced', url: '/', reducedMotion: 'reduce' },
  { name: 'home-mobile', url: '/', viewport: MOBILE },
  { name: 'workshop', url: '/workshop' },
  { name: 'contacts', url: '/contacts' },
  { name: 'read-index', url: '/read' },
  { name: 'story-light', story: true },
  { name: 'story-sepia', story: true, readingTheme: 'sepia' },
  { name: 'story-dark', story: true, readingTheme: 'dark' },
  { name: 'story-dark-flash', story: true, readingTheme: 'dark', mode: 'flash' },
  { name: 'story-mobile', story: true, viewport: MOBILE },
];

const browser = await chromium.launch();
const results = [];
let storyUrl = null;

try {
  // Первый URL рассказа берём с /read (первая ссылка вида /read/<book>/<story>).
  {
    const page = await browser.newPage();
    await page.goto(BASE + '/read', { waitUntil: 'load', timeout: 30000 });
    storyUrl = await page.evaluate(() => {
      const a = [...document.querySelectorAll('a[href^="/read/"]')]
        .map((el) => el.getAttribute('href'))
        .find((h) => /^\/read\/[^/]+\/[^/]+$/.test(h || ''));
      return a || null;
    });
    await page.close();
  }

  for (const st of STATES) {
    if (ONLY.length && !ONLY.some((o) => st.name.includes(o))) continue;
    const url = st.story ? storyUrl : st.url;
    if (!url) {
      results.push(`SKIP ${st.name} — не найдена ссылка на рассказ на /read`);
      continue;
    }
    const ctx = await browser.newContext({
      viewport: st.viewport || DESKTOP,
      reducedMotion: st.reducedMotion || 'no-preference',
    });
    if (st.readingTheme) {
      await ctx.addInitScript((t) => {
        try { localStorage.setItem('kirilov:reading-theme', t); } catch {}
      }, st.readingTheme);
    }
    const page = await ctx.newPage();
    const file = path.join(OUT, `${st.name}.png`);
    try {
      if (st.mode === 'flash') {
        // Кадр как можно раньше после навигации — ловим FOUC/вспышку темы.
        await page.goto(BASE + url, { waitUntil: 'commit', timeout: 30000 });
        await page.screenshot({ path: file });
      } else {
        await page.goto(BASE + url, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(700); // дать шрифтам/анимациям осесть
        await page.screenshot({ path: file, fullPage: false });
      }
      results.push(`OK   ${st.name} → ${file}`);
    } catch (e) {
      results.push(`FAIL ${st.name} — ${String(e).split('\n')[0]}`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}

console.log(results.join('\n'));
console.log(`\nПапка со снимками: ${OUT}`);
const fails = results.filter((r) => r.startsWith('FAIL')).length;
process.exit(fails ? 1 : 0);
