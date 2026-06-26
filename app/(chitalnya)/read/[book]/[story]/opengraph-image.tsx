import { getAllStories, getStory, getBooks } from "@/lib/content";
import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

// Динамическая OG-карточка рассказа (§11-E3): первая строка как событие на «документе».
// Статически — по одной PNG на рассказ (на сборке).
export const dynamicParams = false;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Рассказ — Боковым зрением, Евгений Кирилов";

export function generateStaticParams() {
  return getAllStories().map((s) => ({ book: s.book, story: s.slug }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ book: string; story: string }>;
}) {
  const { book, story } = await params;
  const s = getStory(story);
  const bookMeta = getBooks().find((b) => b.id === book);
  return ogCard({
    headline: s?.firstLine ?? s?.title ?? "Боковым зрением",
    footerLeft: bookMeta?.title ?? "",
    footerRight: "Читальня",
  });
}
