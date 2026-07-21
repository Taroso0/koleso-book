"use client";

import Link from "next/link";
import { GlitchText } from "@/components/haunted/GlitchText";
import { systemVoice } from "@/content/systemVoice";

// Сцена ошибки (§6) — сестра NotFoundScene и по вёрстке, и по причине существования:
// error.tsx рендерится под КОРНЕВЫМ layout, слой «Витрины» (зерно/курсор/Lenis) сюда
// не доходит, поэтому «офисную готику» несёт сама сцена (класс dark + .notfound).
// Отличие от 404 — здесь есть что предложить: reset() перемонтирует поддерево, и
// разовый сбой (потеря WebGL-контекста, споткнувшийся остров) чинится на месте, без
// перезагрузки страницы. Выход на «/» — второй, потому что читателя не надо выгонять
// со страницы, если можно просто попробовать ещё раз.
export function ErrorScene({
  reset,
  play = true,
}: {
  reset?: () => void;
  play?: boolean;
}) {
  return (
    <main id="main" tabIndex={-1} className="notfound dark">
      <div className="notfound__periph" aria-hidden />
      {/* не повторяем «сбой» — оно уже кричит разрядом ниже */}
      <p className="notfound__eyebrow font-mono">Отказ · страница не собралась</p>
      <GlitchText
        text="СБОЙ"
        className="notfound__code notfound__code--word"
        play={play}
      />
      <p className="notfound__line font-serif">{systemVoice.error}</p>
      <p className="notfound__back font-mono">
        {reset && (
          <>
            {/* uppercase явно: Preflight ставит button{text-transform:none}, поэтому
                кнопка НЕ наследует text-transform от .notfound__back и вышла бы
                строчной рядом с прописной ссылкой (та же ловушка наследования, что
                у .notfound__code и .notfound__back с цветом). */}
            <button
              type="button"
              onClick={reset}
              className="uppercase underline-offset-4 hover:underline"
            >
              попробовать снова
            </button>
            {" · "}
          </>
        )}
        <Link href="/">вернуться к Колесу →</Link>
      </p>
    </main>
  );
}
