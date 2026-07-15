import { describe, it, expect } from "vitest";
import { applyTypograf } from "@/lib/typograf";

// Контрактные тесты обёртки над библиотекой typograf (locale ru + en-US). Проверяем
// не логику репозитория, а что интеграция даёт ожидаемую русскую микротипографику.
describe("applyTypograf", () => {
  it("прямые кавычки → «ёлочки»", () => {
    expect(applyTypograf('Он сказал "привет" тихо.')).toContain("«привет»");
  });

  it("дефис между словами с пробелами → тире", () => {
    expect(applyTypograf("Москва - Париж")).toContain("—");
  });

  it("троеточие → символ …", () => {
    expect(applyTypograf("Ждём...")).toContain("…");
  });

  it("неразрывный пробел после короткого предлога", () => {
    expect(applyTypograf("Шли в лес.")).toContain(" ");
  });

  it("пустая строка → пустая строка", () => {
    expect(applyTypograf("")).toBe("");
  });

  it("идемпотентность: f(f(x)) === f(x)", () => {
    const once = applyTypograf('Он сказал "привет" - и ушёл...');
    expect(applyTypograf(once)).toBe(once);
  });
});
