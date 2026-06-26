import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

// Дефолтная OG-карточка сайта (хаб и все страницы без своей картинки).
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Боковым зрением — авторский сайт Евгения Кирилова";

export default async function OgImage() {
  return ogCard({
    headline: "Чудо живёт не в космосе, а в обыденном. Его видно боковым зрением.",
    footerLeft: "Колизей · Колесо Сансары",
    footerRight: "Авторский сайт",
  });
}
