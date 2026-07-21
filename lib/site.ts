// Единственный источник абсолютного адреса сайта. Раньше эта же строка с тем же
// плейсхолдером была скопирована в трёх местах (app/layout.tsx — metadataBase,
// app/sitemap.ts, app/robots.ts): три шанса разойтись и ни одного сигнала, если
// домен так и не задали.

const PLACEHOLDER = "https://kirilov.example";

/** Абсолютный адрес сайта: нужен для metadataBase, canonical, OG и sitemap. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? PLACEHOLDER;

/** Домен так и не задан — все абсолютные URL указывают в никуда.
 *  Сигналит об этом не сам модуль, а `scripts/check-env.mjs` на prebuild: модуль
 *  вычисляется в каждом серверном бандле отдельно (Turbopack собирает маршруты в
 *  разных процессах), и предупреждение отсюда печаталось бы по разу на бандл. */
export const SITE_URL_IS_PLACEHOLDER = SITE_URL === PLACEHOLDER;

/** Тот же плейсхолдер знает и check-env.mjs — держим его экспортируемым, чтобы
 *  значение не разъехалось по двум файлам (ровно та болезнь, от которой этот
 *  модуль и появился). */
export const SITE_URL_PLACEHOLDER = PLACEHOLDER;
