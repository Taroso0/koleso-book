import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Боковым зрением</h1>
      <p className="max-w-md text-muted-foreground">
        Каркас сайта Евгения Кирилова. «Колесо», Читальня и слой «офисной готики» —
        впереди. Временная страница-смоук: «ёлочки», тире — и ударение, во́ду.
      </p>
      <Button>Войти в Читальню</Button>
    </main>
  );
}
