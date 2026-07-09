# «Боковым зрением» — дизайн-система Евгения Кирилова

Язык бренда — **«офисная готика»**: чудесное внутри обыденного. Институциональные
нейтрали плюс «натриевый» оранжевый акцент; дуальная типографика «душа против
системы». Полное описание языка — `guidelines/docs/концепция.md`.

## Обёртка и тема
- Провайдер **не нужен** — компоненты самодостаточны. Стили приходят из замыкания
  `styles.css`, которое подключается к каждому дизайну автоматически.
- Тёмная тема — класс **`.dark`** на любом предке (токены переопределяются каскадом);
  светлая — по умолчанию.

## Идиома стилизации — токены через `var(--*)`
Tailwind v4 (CSS-first) + shadcn-токены. Цвета и шрифты живут на `:root` как
CSS-переменные — **используйте их для собственной вёрстки**:

- **Цвета (семантика):** `--background --foreground --card --popover --primary
  --secondary --muted --accent --destructive --border --input --ring`
  (у каждого цвета есть парный `*-foreground`, где применимо).
- **Бренд-семантика:** `--sodium` (натриевый оранжевый — «магия»/фокус),
  `--paper` (документ/архив), `--concrete` (поверхности), `--monitor` (свечение монитора).
- **Типографика:** `--font-system` (Inter — UI/«машина»), `--font-prose`
  (Source Serif 4 — проза/«душа»), `--font-mono-accent` (JetBrains Mono). Все с кириллицей.
- **Скругление:** токен `--radius` (+ `--radius-md`); утилиты `rounded-sm/-md/-lg`.

> **Важно про утилиты.** В `_ds_bundle.css` материализован ТОЛЬКО тот набор
> Tailwind-утилит, что уже использует сайт, — произвольные классы (`mt-<N>`,
> `grid-cols-<N>` и т. п.) могут отсутствовать и не дадут стиля. Для своей вёрстки
> надёжнее всего инлайн-стили с `var(--…)` либо утилиты, которые точно есть
> (сверьтесь с `_ds_bundle.css`). Токены `var(--*)` работают всегда.

## Где правда
- Стили: `styles.css` → `fonts/fonts.css` + `_ds_bundle.css` (`:root`/`.dark` токены + утилиты).
- Компоненты: `components/<группа>/<Имя>/<Имя>.prompt.md` и `<Имя>.d.ts` — контракт и примеры
  каждого. Группы: `general` (Button, EmptyState), `workshop` (KindBadge, WorkshopCard),
  `reader` (ProseBody, IllustrationPlate), `haunted` (GlitchText, StoryOpening, SystemLoader,
  StaticGrain, FogReveal), `motion` (Reveal, AccentLine), `wheel` (WheelIndex),
  `vitrina` (NotFoundScene, WarmWindowHero).
- Язык бренда: `guidelines/docs/концепция.md`.

## Button — API
- `variant`: `default` · `outline` · `secondary` · `ghost` · `destructive` · `link`.
- `size`: `default` · `xs` · `sm` · `lg` · `icon` · `icon-xs` · `icon-sm` · `icon-lg`
  (`icon*` — квадратные, под иконку).
- `asChild` — рендер как дочерний элемент (например, `<a>` в роли кнопки).
- Иконка: положите `<svg>` ребёнком (авто-размер); для ведущей/замыкающей —
  атрибут `data-icon="inline-start" | "inline-end"`.

## Остальные компоненты — API (детали в `<Имя>.d.ts` / `.prompt.md`)
- **KindBadge** — mono-чип вида записи. `kind`: `fragment`·`draft`·`note`·`illustration`; `className`.
- **ProseBody** — serif-проза («душа»). `body: string`: абзацы через пустую строку, отдельная
  строка `***` = разделитель сцен, `*…*` = курсив. Оборачивайте в `font-family: var(--font-prose)`.
- **GlitchText** — «системный регистр». `text`, `play?` (разряд-анимация, по умолч. `true`),
  `className`, `onDone?`.
- **StoryOpening** — «первая строка как событие». `text`, `variant?` (`rise`·`cascade`·`glitch`),
  `slug?`, `className`, `onDone?`. У движения есть статический паритет (reduced-motion).
- **WorkshopCard / IllustrationPlate / WheelIndex** — редакционные, данные передаются пропом:
  `WorkshopCard entry={…}`, `IllustrationPlate illustration={…}`, `WheelIndex graph={{nodes,links}}`
  (структуры — в `.d.ts`). В бандле `next/link` → нативный `<a>`, `next/image` → `<img>`: ссылки и
  картинки — обычные элементы, задавайте реальные `href`/`src`.

## Состояния системы — API
Три готовые сцены «одержимой системы». Каждая несёт свой фон и тему сама (`SystemLoader` и
`NotFoundScene` — тёмные, с `dark` внутри), поэтому ставьте их full-bleed и **не** оборачивайте
в свои контейнеры с фоном или отступами.
- **SystemLoader** — фолбэк загрузки на весь экран. `label?` — моно-регистр над репликой
  («Сборка мира», «Открываем рассказ»).
- **EmptyState** — светлое пустое состояние внутри страницы. `line?` — сериф-реплика («душа»),
  `note?` — моно-приписка.
- **NotFoundScene** — сцена 404 целиком. `play?` — проигрывать «разряд» на «404» (по умолч. `true`;
  для статичных снимков передавайте `false`).

## Атмосфера и движение — API
- **StaticGrain** — плёночное зерно на весь вьюпорт (`position: fixed`, `mix-blend-mode: overlay`).
  Без пропов; кладите **один раз** поверх сцены — два слоя сложатся по непрозрачности.
- **Reveal** — контент всплывает и проступает при входе в кадр: `children`, `y?`, `stagger?`
  (шаг для прямых детей, сек), `start?`, `once?`.
- **FogReveal** — выход из размытия («из тумана»): `children`, `blur?`, `start?`. Жест тяжёлый —
  один объект на экран.
- **AccentLine** — короткая натриевая черта под заголовком: `className?`, `start?`.
- `start` — порог ScrollTrigger. Для контента, который уже в кадре, ставьте `start="top bottom"`,
  иначе проявление не запустится.
- У всех есть **статический паритет**: при `prefers-reduced-motion: reduce` показывается конечное
  состояние, а не «выключено».

## Первый экран — API
- **WarmWindowHero** — готовый герой «Витрины»: ночная громада здания, одно тёплое окно и тизер
  «Колеса» на стене. Несёт единственный `<h1>` страницы и `dark`, ставится full-bleed.
  `degrees: Record<string, number>` — id темы → число рассказов: задаёт вес орбиты и выбирает тему,
  к которой тянется горящий путь.

## Пример
```tsx
// Button — из window.Kirilov; собственная вёрстка — токенами бренда.
<div style={{ display: "flex", gap: "var(--radius)", alignItems: "center",
              fontFamily: "var(--font-system)", color: "var(--foreground)" }}>
  <Button variant="default">Открыть Колесо</Button>
  <Button variant="outline">Все рассказы</Button>
  <Button variant="ghost">Подробнее</Button>
</div>
```
