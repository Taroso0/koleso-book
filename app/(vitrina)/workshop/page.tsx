import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { AccentLine } from "@/components/motion/AccentLine";
import { WorkshopCard } from "@/components/workshop/WorkshopCard";
import { getWorkshopEntries } from "@/lib/workshop";

export const metadata = { title: "Мастерская — Боковым зрением" };

// «Мастерская» (§9/§11-A3): building-in-public 3-й книги. Раздел «Витрины» (моушн
// допустим), но проза записей статична (§5). Контент файловый (content/workshop/*),
// загрузка изолирована в lib/workshop.ts — задел под опц. CMS, не трогая канон.
export default function WorkshopIndex() {
  const entries = getWorkshopEntries();

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          ← Витрина
        </Link>
      </p>

      <Reveal>
        <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-balance">
          Мастерская
        </h1>
        <AccentLine className="mt-3" />
        <p className="mt-4 font-serif text-lg leading-prose text-muted-foreground">
          Третья книга растёт на глазах: фрагменты, черновики, заметки и новые
          иллюстрации. Building-in-public для художественной прозы — не готовый
          том, а стол, на котором он собирается.
        </p>
      </Reveal>

      {entries.length > 0 ? (
        <Reveal stagger={0.06} className="mt-14">
          {entries.map((entry) => (
            <WorkshopCard key={entry.slug} entry={entry} />
          ))}
        </Reveal>
      ) : (
        <div className="mt-14 border-t border-border pt-12 text-center">
          <p className="font-serif text-lg leading-prose text-muted-foreground">
            Здесь пока тихо. Хотя кто-то только что вышел.
          </p>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Стол ещё накрывается
          </p>
        </div>
      )}
    </main>
  );
}
