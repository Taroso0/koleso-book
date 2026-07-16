// Авторская превью WarmWindowHero — первый экран «Витрины»: холодная ночная громада
// здания и одно тёплое окно, которое горит с первого пикселя (свет по Хопперу). На стене
// фасада — логотип-трафарет «Наблюдатель» (PNG-маска красится в --ink-soft; в шипнутом
// CSS маска инлайнится data-URI на харвесте). Сцена несёт .dark сама и читается без JS,
// поэтому рендерим full-bleed, одной ячейкой (в ней единственный <h1> страницы).
//
// Детерминизм кадра (капчер не глушит анимации):
//  · matchMedia → reduced: гасит и мерцание окна (data-haunt от useHauntedCapability),
//    и каскад зачина. Это штатный статический паритет сцены, а не «выключенный» вид.
//  · sessionStorage-ключ зачина — второй рубеж: даже если патч не сработает, HeroZachin
//    решит, что событие уже сыграно в этой сессии, и покажет кикер статикой.
import { WarmWindowHero } from "kirilov";

if (typeof window !== "undefined") {
  const real = window.matchMedia.bind(window);
  window.matchMedia = ((q: string) =>
    /prefers-reduced-motion/.test(q)
      ? {
          matches: true,
          media: q,
          onchange: null,
          addEventListener() {},
          removeEventListener() {},
          addListener() {},
          removeListener() {},
          dispatchEvent: () => false,
        }
      : real(q)) as typeof window.matchMedia;
  try {
    sessionStorage.setItem("zachin:hero", "1");
  } catch {
    /* приватный режим — не страшно, выше уже стоит reduced */
  }
}

export const FirstScreen = () => <WarmWindowHero />;
