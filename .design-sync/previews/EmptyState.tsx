// Авторская превью EmptyState — пустое состояние в «голосе одержимой системы» (§6).
// Сериф-реплика («душа») + опц. моно-приписка («система»). Светлое: встраивается в
// обычную страницу под уже отрисованным заголовком. Покой — ничего не движется.
import { EmptyState } from "kirilov";

const Page = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      maxWidth: "42rem",
      margin: "0 auto",
      padding: "40px 24px 56px",
      background: "var(--background)",
      color: "var(--foreground)",
    }}
  >
    {children}
  </div>
);

const Heading = ({ children }: { children: React.ReactNode }) => (
  <h2
    style={{
      margin: 0,
      fontFamily: "var(--font-prose)",
      fontSize: 26,
      fontWeight: 500,
      letterSpacing: "-0.01em",
    }}
  >
    {children}
  </h2>
);

// Канон: реплика по умолчанию, без приписки — «здесь просто пусто».
export const Default = () => (
  <Page>
    <Heading>Записи</Heading>
    <EmptyState />
  </Page>
);

// Контекстный вариант: своя реплика + моно-приписка снизу (лента «Мастерской»).
export const WithNote = () => (
  <Page>
    <Heading>Мастерская</Heading>
    <EmptyState
      line="Здесь пока тихо. Хотя кто-то только что вышел."
      note="Стол ещё накрывается"
    />
  </Page>
);
