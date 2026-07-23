import Typograf from "typograf";

// Русская микротипографика на этапе сборки (§6/§9): «ёлочки», неразрывные пробелы,
// тире, многоточия. Прогон — при SSG-рендере (build-time), а не в рантайме.
// mode по умолчанию = реальные Unicode-символы (не HTML-сущности) → подходит для React.
const tp = new Typograf({ locale: ["ru", "en-US"] });

/** Применить русскую типографику к фрагменту прозы. Идемпотентно. */
export function applyTypograf(text: string): string {
  return tp.execute(text);
}

const ROMAN = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
  [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
  [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
] as const;

/** Год римскими — типографический регистр выходных данных на обложке (2022 → MMXXII).
 *  Считается из канонического book.year, а не дублируется строкой в данных: иначе
 *  на обложке и в сведениях со временем окажутся разные годы. */
export function romanYear(year: number): string {
  let rest = Math.trunc(year);
  if (rest <= 0) return "";
  let out = "";
  for (const [value, glyph] of ROMAN) {
    while (rest >= value) {
      out += glyph;
      rest -= value;
    }
  }
  return out;
}
