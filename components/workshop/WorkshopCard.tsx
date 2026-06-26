import Link from "next/link";
import Image from "next/image";
import type { WorkshopEntry } from "@/content/schema";
import { formatRuDate } from "@/lib/utils";
import { KindBadge } from "./KindBadge";

// Карточка ленты «Мастерской»: вид + дата + название + тизер (+ опц. миниатюра).
// Ведёт на отдельную страницу записи (дип-линк). Серверный компонент.
export function WorkshopCard({ entry }: { entry: WorkshopEntry }) {
  return (
    <Link
      href={`/workshop/${entry.slug}`}
      className="group block border-t border-border py-6 transition-colors hover:border-foreground/40"
    >
      <div className="flex items-center gap-3">
        <KindBadge kind={entry.kind} />
        <time
          dateTime={entry.date}
          className="font-mono text-xs tabular-nums text-muted-foreground"
        >
          {formatRuDate(entry.date)}
        </time>
      </div>

      <div className="mt-3 flex items-start gap-5">
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-2xl font-medium tracking-tight underline-offset-4 group-hover:underline">
            {entry.title}
          </h2>
          {entry.summary && (
            <p className="mt-2 font-serif leading-prose text-muted-foreground line-clamp-2">
              {entry.summary}
            </p>
          )}
        </div>

        {entry.image && entry.imageWidth && entry.imageHeight && (
          <Image
            src={entry.image}
            width={entry.imageWidth}
            height={entry.imageHeight}
            alt=""
            aria-hidden
            sizes="80px"
            className="hidden h-20 w-20 shrink-0 border border-border object-cover sm:block"
          />
        )}
      </div>
    </Link>
  );
}
