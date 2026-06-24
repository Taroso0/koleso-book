"use client";

import { useLayoutEffect } from "react";
import { getReadingTheme } from "./reading";

// Применяет сохранённую тему чтения к <html> ПОСЛЕ гидрации (Шаг 2.3).
// Без инлайн-скрипта и без hydration-mismatch: атрибут ставится на клиенте.
// Дефолт «светлая» = глобальный дефолт, поэтому для неё вспышки нет.
export function ReadingThemeInit() {
  useLayoutEffect(() => {
    document.documentElement.dataset.readingTheme = getReadingTheme();
  }, []);
  return null;
}
