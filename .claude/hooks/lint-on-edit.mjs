#!/usr/bin/env node
// Хук Claude Code (PostToolUse): после правки файла живого кода (app/,
// components/, lib/, content/) прогоняет по нему ESLint. Проблемы показываются
// ассистенту (exit 2), чтобы он исправил их сразу. Файлы вне живого кода
// (ds-bundle/, .ds-sync/ и пр.) и чистые прогоны — тихий выход.
// Корень проекта берётся от расположения самого скрипта: рабочий каталог
// сессии значения не имеет (в nalogi относительный путь дал 363 холостых
// падения хука).

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// 1. Вход хука — JSON со сведениями о вызванном инструменте (stdin).
let input = '';
try {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  input = Buffer.concat(chunks).toString('utf8');
} catch {
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(input || '{}');
} catch {
  process.exit(0);
}

const filePath = payload?.tool_input?.file_path;
if (!filePath) process.exit(0);
if (!/\.(tsx?|mts|jsx?|mjs)$/i.test(String(filePath))) process.exit(0);

// 2. Только живой код: сгенерированное и пайплайны не линтуем.
const rel = path.relative(ROOT, path.resolve(String(filePath)));
if (rel.startsWith('..') || path.isAbsolute(rel)) process.exit(0);
const top = rel.split(path.sep)[0];
if (!['app', 'components', 'lib', 'content'].includes(top)) process.exit(0);

// 3. Локальный ESLint напрямую через node (без npx/.cmd-обёрток — на Windows
//    они дают EINVAL) и с относительным путём от корня проекта.
const eslintBin = path.join(ROOT, 'node_modules', 'eslint', 'bin', 'eslint.js');
if (!existsSync(eslintBin)) process.exit(0);

const res = spawnSync(process.execPath, [eslintBin, '--no-warn-ignored', rel], {
  cwd: ROOT,
  encoding: 'utf8',
});

if (res.error) process.exit(0); // не удалось запустить — не мешаем
if (res.status === 0) process.exit(0); // чисто

const report = `${res.stdout || ''}\n${res.stderr || ''}`.trim();
console.error(
  `⚠ ESLint нашёл проблемы в только что изменённом файле:\n${report}\n` +
    `Исправь НОВЫЕ проблемы прежде чем двигаться дальше. Известный baseline — ` +
    `8 ошибок react-hooks/react-compiler (список в CLAUDE.md → «Проверка ` +
    `изменений»); их в рамках текущей задачи не чинить и не маскировать.`,
);
process.exit(2);
