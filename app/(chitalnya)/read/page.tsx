import Link from "next/link";

// Плейсхолдер индекса «Читальни» (наполнение — Фаза 2). Нативный скролл.
export default function ReadIndex() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          ← Витрина
        </Link>
      </p>
      <h1 className="mt-4 font-sans text-3xl font-medium tracking-tight">Читальня</h1>
      <p className="mt-6 font-serif text-lg leading-[1.7] text-muted-foreground">
        Среда чтения (Фаза 2). Здесь нативный скролл — без Lenis и тяжёлого моушена:
        длинный текст несовместим с инерцией.
      </p>
      <div className="mt-10 space-y-5 font-serif leading-[1.7]">
        {Array.from({ length: 8 }).map((_, i) => (
          <p key={i}>
            Тестовый абзац {i + 1}. «Боковым зрением» — чудо живёт не в космосе, а в
            служебном помещении: в офисе, в фонаре, в системной папке, на скамейке. Мы
            просто замечаем не всё, что происходит рядом.
          </p>
        ))}
      </div>
    </main>
  );
}
