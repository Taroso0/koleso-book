import Typograf from "typograf";

// Русская микротипографика на этапе сборки (§6/§9): «ёлочки», неразрывные пробелы,
// тире, многоточия. Прогон — при SSG-рендере (build-time), а не в рантайме.
// mode по умолчанию = реальные Unicode-символы (не HTML-сущности) → подходит для React.
const tp = new Typograf({ locale: ["ru", "en-US"] });

/** Применить русскую типографику к фрагменту прозы. Идемпотентно. */
export function applyTypograf(text: string): string {
  return tp.execute(text);
}
