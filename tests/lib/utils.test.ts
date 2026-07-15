import { describe, it, expect } from "vitest";
import { cn, formatRuDate } from "@/lib/utils";

describe("cn", () => {
  it("объединяет классы", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("разрешает конфликт Tailwind — побеждает последний", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("отбрасывает falsy-значения", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("поддерживает условные объекты и массивы", () => {
    expect(cn("base", { active: true, hidden: false }, ["x", "y"])).toBe(
      "base active x y",
    );
  });

  it("пустой ввод → пустая строка", () => {
    expect(cn()).toBe("");
  });
});

describe("formatRuDate", () => {
  it("ISO YYYY-MM-DD → ДД.ММ.ГГГГ", () => {
    expect(formatRuDate("2026-06-22")).toBe("22.06.2026");
  });

  it("лишние сегменты игнорируются", () => {
    expect(formatRuDate("2026-06-22-99")).toBe("22.06.2026");
  });

  it("без валидации: битый ввод не бросает, а даёт предсказуемую строку", () => {
    expect(formatRuDate("foo")).toBe("undefined.undefined.foo");
    expect(formatRuDate("")).toBe("undefined.undefined.");
  });
});
