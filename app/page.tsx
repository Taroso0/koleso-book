import { Button } from "@/components/ui/button";

// Временный типографический специмен (Шаг 1.2): сверка дуальной системы и кириллицы.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          боковым зрением · каркас
        </p>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-balance">
          Душа против системы
        </h1>
      </header>

      <section className="space-y-6">
        <p className="font-serif text-lg leading-[1.7]">
          Проза (антиква). Как давно вы смотрели в небо? «Ёлочки», короткое тире –
          и длинное — тире, многоточие… ударение: во́ду. Дед Мороз приносил подарки
          под ёлку.
        </p>
        <p className="font-sans text-base text-muted-foreground">
          Система (гротеск Inter). Меню, метаданные, интерфейс. «Кавычки», тире —
          и ударение во́ду читаются ровно.
        </p>
        <p className="font-mono text-sm">
          Машина (моно). recycle_bin · fake_it · во́ду · «—…»
        </p>
      </section>

      <div className="flex items-center gap-4">
        <Button>Войти в Читальню</Button>
        <span className="text-sm font-medium text-sodium">натриевый акцент</span>
      </div>
    </main>
  );
}
