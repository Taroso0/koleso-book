import { systemVoice } from "@/content/systemVoice";

// Пустое состояние (§6, регистр «души»): сериф-реплика + опц. моно-приписка. Общая
// подача, чтобы «Мастерская» и любые будущие пустые списки говорили одним голосом.
// Светлое (встраивается в светлую поверхность страницы); покой — ничего не движется (§10).
export function EmptyState({
  line = systemVoice.empty.default,
  note,
}: {
  line?: string;
  note?: string;
}) {
  return (
    <div className="empty-state">
      <p className="empty-state__line font-serif">{line}</p>
      {note ? <p className="empty-state__note font-mono">{note}</p> : null}
    </div>
  );
}
