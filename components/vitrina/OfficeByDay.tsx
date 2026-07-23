import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";

// Офис днём (§4, Шаг 8): светлые тизеры Витрины «Автор» и «Мастерская» как документ и
// стол с черновиками. Серверные компоненты — клиентского JS ноль, кроме уже существующей
// границы <Reveal> (проявление в кадре с reduced-motion-паритетом, §10). Вся физичность
// (штриховки, штамп, линовка, наклоны) — в globals.css, scoped под .office-day. Поле-
// пометки и штамп декоративны (aria-hidden): смысл несут заголовок и голос автора,
// пометки — бюрократическая фактура. Плотность даётся вёрсткой, не добавленным текстом.

/** Верхний колонтитул «служебных страниц» — открывает светлый документ (перед «Автором»). */
export function ServiceRunHead() {
  return (
    <div className="runhead">
      <p className="mono-mark">боковым зрением · служебные страницы</p>
      <p className="mono-mark">лист 04–05</p>
    </div>
  );
}

/** Нижний колонтитул (после «Мастерской») — закрывающая пометка. Девиз «littera scripta
 *  manet» намеренно не дублируем: он уже стоит кодой секции «Книги». */
export function ServiceRunFoot() {
  return (
    <div className="runfoot">
      <p className="mono-mark">продолжение — ночью</p>
    </div>
  );
}

/** «Автор» — личный лист рабочего поля: пометки на полях + машинописный документ
 *  с голосом автора, подписью, фотокарточкой-плейсхолдером и натриевым штампом. */
export function AuthorSheet() {
  return (
    <Reveal>
      <section id="author" aria-labelledby="author-heading" className="field">
        <aside className="field-margin" aria-hidden>
          <span className="mono-mark mm">разд. 04</span>
          <div className="rule" />
          <span className="mono-mark mm">автор</span>
          <span className="mono-mark mm">рег. 14.02.2024</span>
        </aside>

        <div className="field-bg">
          <h2
            id="author-heading"
            className="font-serif text-2xl font-medium tracking-tight"
          >
            Автор
          </h2>
          <div className="h-rule" />

          <article className="doc">
            <header className="doc-head">
              <p className="mono-mark">личный лист · экз. единственный</p>
              <p className="mono-mark">форма № 2-А</p>
            </header>

            <div className="doc-body">
              <div>
                <p className="mono-mark lead-in">
                  кирилов, евгений · род занятий: автор · жанр: офисная готика
                </p>
                <p className="voice">
                  Евгений Кирилов пишет «офисную готику» — чудо, спрятанное в сером
                  корпоративном быту: в опенспейсе, в фонаре в три часа ночи, в
                  системном уведомлении. Тепло, иронично, по-человечески — а не
                  торжественно.
                </p>
                <div className="sig-row">
                  <span className="sig">Е.&nbsp;Кирилов</span>
                  <span className="mono-mark">подпись</span>
                </div>
              </div>

              <figure>
                <div className="photo">
                  <div className="corner tl" />
                  <div className="corner br" />
                </div>
                <figcaption className="mono-mark photo-cap">
                  место для фотокарточки · скоро
                </figcaption>
              </figure>
            </div>

            <div className="stamp" aria-hidden>
              <b>принято к прочтению</b>вх. № 2026-071
            </div>
          </article>
        </div>
      </section>
    </Reveal>
  );
}

/** «Мастерская» — стол с тремя черновиками разного тона (тизер на главной; ссылка ведёт
 *  на отдельную /workshop). Фрагменты — заглушки-фактура (свой текст за автором). d1
 *  отличается от стопки черновиков «Книг», чтобы фрагмент не повторялся на странице. */
export function WorkshopDesk() {
  return (
    <Reveal>
      <section id="workshop" aria-labelledby="workshop-heading" className="field">
        <aside className="field-margin" aria-hidden>
          <span className="mono-mark mm">разд. 05</span>
          <div className="rule" />
          <span className="mono-mark mm">мастерская</span>
          <span className="mono-mark mm">обн. 12.07.2026</span>
        </aside>

        <div className="field-bg">
          <h2
            id="workshop-heading"
            className="font-serif text-2xl font-medium tracking-tight"
          >
            Мастерская
          </h2>
          <div className="h-rule" />
          <p className="lede">
            Третья книга растёт на глазах: фрагменты, черновики, заметки и новые
            иллюстрации. Building-in-public для художественной прозы.
          </p>

          <div className="desk">
            <article className="draft d1">
              <p className="mono-mark tag">черновик · фрагмент 12 · 12.07</p>
              <p className="frag">
                В переговорной горит свет <s>третьи сутки</s> — а войти внутрь никто
                не решается.
              </p>
              <div className="lines" />
            </article>

            <article className="draft d2">
              <p className="mono-mark tag">заметка · без даты</p>
              <p className="frag">
                Проверить: как звучит уведомление, если его никто не читает.
              </p>
              <div className="lines" />
            </article>

            <article className="draft d3">
              <p className="mono-mark tag">иллюстрация · тушь · скоро</p>
              <div className="ill" />
            </article>
          </div>

          <Link href="/workshop" className="read">
            Зайти в Мастерскую →
          </Link>
        </div>
      </section>
    </Reveal>
  );
}
