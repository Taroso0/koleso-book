// Проверка окружения перед прод-сборкой (npm run build → prebuild).
//
// Почему отдельным скриптом, а не проверкой внутри lib/site.ts: Turbopack собирает
// маршруты в разных процессах, модуль вычисляется в каждом серверном бандле, и одно
// и то же предупреждение печаталось бы 13 раз. Проверка окружения — работа сборки,
// а не рантайм-модуля.
//
// Сейчас предупреждает, но НЕ роняет сборку: сайт ещё не запускается, красный build
// мешал бы работе. Когда появится дата запуска — заменить console.warn на
// process.exit(1) (пункт заведён в docs/задачи.md).

const PLACEHOLDER = "https://kirilov.example"; // = SITE_URL_PLACEHOLDER из lib/site.ts

const problems = [];

if (!process.env.NEXT_PUBLIC_SITE_URL) {
  problems.push(
    `NEXT_PUBLIC_SITE_URL не задан — используется плейсхолдер ${PLACEHOLDER}.\n` +
      "   canonical, OG-карточки, sitemap.xml и robots.txt будут ссылаться на " +
      "несуществующий домен.",
  );
} else {
  try {
    // Плохой URL уронил бы сборку внутри new URL(...) в metadataBase — там сообщение
    // будет куда менее понятным, чем здесь.
    new URL(process.env.NEXT_PUBLIC_SITE_URL);
  } catch {
    problems.push(
      `NEXT_PUBLIC_SITE_URL="${process.env.NEXT_PUBLIC_SITE_URL}" — не адрес. ` +
        "Ожидается абсолютный URL со схемой, например https://example.com",
    );
  }
}

if (problems.length > 0) {
  console.warn("\n⚠️  Проверка окружения:");
  for (const p of problems) console.warn(`   • ${p}`);
  console.warn("");
}
