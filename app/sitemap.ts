import type { MetadataRoute } from "next";
import { getAllStories, getBooks } from "@/lib/content";
import { getWorkshopEntries } from "@/lib/workshop";
import { SITE_URL } from "@/lib/site";

// Sitemap всех маршрутов (§11-E3). Один файл — у нас ~45 URL; generateSitemaps нужен
// лишь для >50k/шардинга. Контент известен на сборке → статический sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const u = (p: string) => `${SITE_URL}${p}`;
  const books = getBooks();
  const stories = getAllStories();
  const workshop = getWorkshopEntries();

  return [
    { url: u("/"), lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: u("/read"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...books.map((b) => ({
      url: u(`/read/${b.id}`),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    ...stories.map((s) => ({
      url: u(`/read/${s.book}/${s.slug}`),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    { url: u("/workshop"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...workshop.map((e) => ({
      url: u(`/workshop/${e.slug}`),
      lastModified: new Date(e.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    { url: u("/contacts"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];
}
