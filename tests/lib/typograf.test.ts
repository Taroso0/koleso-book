import { describe, it, expect } from "vitest";
import { applyTypograf, romanYear } from "@/lib/typograf";

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

// Годы обложек «Витрины» (§9). Реальные значения — 2022 и 2023; остальные случаи
// стерегут вычитание разрядов (вычитательные пары IV/IX/XL/CM) и деградацию на мусоре.
describe("romanYear", () => {
  it("годы изданных книг", () => {
    expect(romanYear(2022)).toBe("MMXXII");
    expect(romanYear(2023)).toBe("MMXXIII");
  });

  it("вычитательные пары", () => {
    expect(romanYear(4)).toBe("IV");
    expect(romanYear(9)).toBe("IX");
    expect(romanYear(1990)).toBe("MCMXC");
  });

  it("не-положительный год → пустая строка (год просто не рисуется)", () => {
    expect(romanYear(0)).toBe("");
    expect(romanYear(-5)).toBe("");
  });
});
