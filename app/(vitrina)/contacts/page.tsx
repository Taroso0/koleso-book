import Link from "next/link";
import { farewell, contacts } from "@/content/contacts";

export const metadata = {
  title: "Контакты — Боковым зрением",
  description: "Связаться с автором. Тихий финал — спокойное завершение пути.",
  alternates: { canonical: "/contacts" },
  openGraph: {
    title: "Контакты — Боковым зрением",
    description: "Связаться с автором.",
    url: "/contacts",
  },
};

// «Тихий финал» (§9): минимум движения и света. Полностью статичная страница в
// ночной палитре («Офис ночью» — токены .dark), один тёплый натриевый акцент
// (Хоппер: тёплое окно в холодной громаде). Без моушена → reduced-motion-паритет
// тривиален. Контакты — data-driven (content/contacts.ts), значения за автором.
export default function ContactsPage() {
  return (
    <main id="main" tabIndex={-1} className="dark flex min-h-dvh flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-24">
        <h1 className="sr-only">Контакты</h1>

        <p className="font-serif text-2xl leading-[1.6] text-balance">
          {farewell}
        </p>

        {/* единственный «неправильный» тёплый свет — статичный (без анимации) */}
        <span aria-hidden className="mt-8 block h-px w-16 bg-sodium" />

        {contacts.length > 0 ? (
          <ul className="mt-8 space-y-3 font-mono text-sm">
            {contacts.map((c) => (
              <li key={c.label} className="flex items-baseline gap-4">
                <span className="w-24 shrink-0 uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </span>
                {c.href ? (
                  <a
                    href={c.href}
                    className="underline-offset-4 transition-colors hover:text-sodium hover:underline"
                  >
                    {c.value}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{c.value}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 font-mono text-sm text-muted-foreground">
            Контакты появятся здесь. Окно ещё горит.
          </p>
        )}

        <Link
          href="/"
          className="mt-16 inline-block font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Витрина
        </Link>
      </div>
    </main>
  );
}
