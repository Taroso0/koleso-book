// Авторская превью Button — реальные композиции из DS «Боковым зрением».
// Каждый экспорт-функция = одна ячейка карточки (имя латиницей: /^[A-Z]/).
// Импорт из пакета шимится на window.Kirilov.Button. JSX-runtime — automatic.
import { Button } from "kirilov";

// Локальные хелперы (не экспортируются → не становятся ячейками).
const Row = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
      alignItems: "center",
      padding: 24,
    }}
  >
    {children}
  </div>
);

const ArrowRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const Download = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </svg>
);

// Все шесть вариантов — «душа против системы»: институциональные нейтрали
// плюс натриевый акцент фокуса.
export const Variants = () => (
  <Row>
    <Button variant="default">Открыть Колесо</Button>
    <Button variant="secondary">Все рассказы</Button>
    <Button variant="outline">Фильтр по теме</Button>
    <Button variant="ghost">Подробнее</Button>
    <Button variant="destructive">Убрать закладку</Button>
    <Button variant="link">Читать дальше</Button>
  </Row>
);

// Шкала размеров (текстовая кнопка с одной подписью, чтобы видеть высоту/ритм).
export const Sizes = () => (
  <Row>
    <Button size="xs">Читать</Button>
    <Button size="sm">Читать</Button>
    <Button size="default">Читать</Button>
    <Button size="lg">Читать</Button>
  </Row>
);

// Иконки: квадратные icon-кнопки и кнопка с ведущей иконкой (data-icon=inline-start).
export const Icons = () => (
  <Row>
    <Button size="icon" aria-label="Следующий рассказ">
      <ArrowRight />
    </Button>
    <Button size="icon-sm" variant="outline" aria-label="Следующий рассказ">
      <ArrowRight />
    </Button>
    <Button size="icon-lg" variant="secondary" aria-label="Следующий рассказ">
      <ArrowRight />
    </Button>
    <Button variant="outline">
      <Download data-icon="inline-start" />
      Скачать PDF
    </Button>
  </Row>
);

// Состояния: disabled и asChild (кнопка-ссылка <a>, частый приём навигации).
export const States = () => (
  <Row>
    <Button disabled>Недоступно</Button>
    <Button variant="outline" disabled>
      Недоступно
    </Button>
    <Button asChild variant="link">
      <a href="#">Перейти к рассказу</a>
    </Button>
  </Row>
);
