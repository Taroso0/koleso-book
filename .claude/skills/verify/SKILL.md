---
name: verify
description: Полная проверка проекта — типы (tsc), линт живого кода (eslint), прод-сборка (next build). Запускать перед «готово» и перед коммитом нетривиальных правок.
---

Выполняй из корня проекта (D:\Колесо) последовательно; на первом провале — остановись и чини.

## 1. Типы
```bash
npx tsc --noEmit
```
Должно быть 0 ошибок.

## 2. Линт — только живой код
```bash
npx eslint app components lib content
```
**Не `npm run lint`** — он захватывает сгенерированный `ds-bundle/` (~1850 проблем шума).

Известный baseline — ровно эти 8 ошибок (известный долг: не чинить мимоходом, не маскировать, новых не добавлять):
- `components/wheel/WheelCanvas.tsx:133, 141` — react-hooks/preserve-manual-memoization
- `components/haunted/useHauntedCapability.ts:19` — react-hooks/set-state-in-effect
- `components/motion/MotionProvider.tsx:23` — react-hooks/set-state-in-effect
- `components/reader/ContinueReading.tsx:13` — react-hooks/set-state-in-effect
- `components/reader/ReaderShell.tsx:122` — react-hooks/set-state-in-effect
- `components/haunted/GlitchText.tsx:27` — react-hooks/refs
- `components/haunted/StoryOpening.tsx:37` — react-hooks/refs

**Провал шага = любая ошибка сверх этого списка.** Если строка известной ошибки сдвинулась из-за правок в том же файле — сверяй по файлу и правилу, не по номеру строки.

## 3. Прод-сборка
```bash
npm run build
```
Заодно валидирует контент (zod): невалидный frontmatter ломает сборку с указанием файла и поля. Вывод длинный — смотри хвост (`Select-Object -Last 30` / `tail -30`).

## Дальше
- Визуальные правки → дополнительно `/verify-in-browser`.
- В отчёте: статус каждого шага, список новых проблем (если были) и что именно исправлено.
