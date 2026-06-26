import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getWorkshopEntries,
  getWorkshopEntry,
  getWorkshopIllustration,
} from "@/lib/workshop";
import { ProseBody } from "@/components/reader/ProseBody";
import { IllustrationPlate } from "@/components/reader/IllustrationPlate";
import { KindBadge } from "@/components/workshop/KindBadge";
import { formatRuDate } from "@/lib/utils";
import { themes } from "@/content/themes";

// Полная SSG: все записи известны на сборке, неизвестный slug → 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getWorkshopEntries().map((e) => ({ entry: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ entry: string }>;
}) {
  const { entry } = await params;
  const e = getWorkshopEntry(entry);
  return { title: e ? `${e.title} — Мастерская` : "Мастерская" };
}

const themeLabel = new Map(themes.map((t) => [t.id, t.label]));

// Страница записи «Мастерской». Хедер (вид/дата/название) и плашка могут проявляться
// (Витрина), но проза — статична (§5: «текст не из тумана»; та же среда, что в Reader).
export default async function WorkshopEntryPage({
  params,
}: {
  params: Promise<{ entry: string }>;
}) {
  const { entry } = await params;
  const e = getWorkshopEntry(entry);
  if (!e) notFound();

  const illustration = getWorkshopIllustration(e);

  return (
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <Link href="/workshop" className="hover:text-foreground">
          ← Мастерская
        </Link>
      </p>

      <article className="mt-10">
        <div className="flex items-center gap-3">
          <KindBadge kind={e.kind} />
          <time
            dateTime={e.date}
            className="font-mono text-xs tabular-nums text-muted-foreground"
          >
            {formatRuDate(e.date)}
          </time>
        </div>

        <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-balance">
          {e.title}
        </h1>

        {e.themes.length > 0 && (
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {e.themes.map((id) => (
              <span key={id}>{themeLabel.get(id) ?? id}</span>
            ))}
          </p>
        )}

        {illustration && <IllustrationPlate illustration={illustration} priority />}

        <div className="mt-10 font-serif text-lg leading-prose text-foreground">
          <ProseBody body={e.body} />
        </div>
      </article>
    </main>
  );
}
