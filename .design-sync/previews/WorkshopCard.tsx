// Авторская превью WorkshopCard — карточка ленты «Мастерской» (building-in-public).
// Текстовый вариант (без image) достоверен: next/link шимится на <a>. Несколько
// карточек подряд = лента (border-t у каждой). Импорт из пакета → window.Kirilov.
import { WorkshopCard } from "kirilov";

const entries = [
  {
    slug: "suhoy-kolodec",
    title: "Сухой колодец",
    kind: "fragment" as const,
    date: "2026-05-12",
    summary:
      "Отрывок третьей главы: лифт в подвал, которого нет в плане эвакуации, и табличка «не работает» поверх ещё одной такой же.",
    body: "",
  },
  {
    slug: "pravki-na-polyah",
    title: "Правки на полях",
    kind: "note" as const,
    date: "2026-04-30",
    summary:
      "Короткая заметка о том, почему канцелярский шрифт страшнее любого готического — и как это держит ритм книги.",
    body: "",
  },
  {
    slug: "vtoraya-versiya-finala",
    title: "Вторая версия финала",
    kind: "draft" as const,
    date: "2026-04-18",
    summary:
      "Черновик: герой всё-таки оборачивается. Пока не уверен — слишком милосердно для этого здания.",
    body: "",
  },
];

export const Feed = () => (
  <div
    style={{
      maxWidth: "44rem",
      margin: "0 auto",
      padding: "8px 32px 32px",
      background: "var(--background)",
      color: "var(--foreground)",
      fontFamily: "var(--font-system)",
    }}
  >
    {entries.map((entry) => (
      <WorkshopCard key={entry.slug} entry={entry} />
    ))}
  </div>
);
