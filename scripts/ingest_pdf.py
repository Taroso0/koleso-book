"""Шаг 0.1 — извлечение и чистка текста рассказов из печатных PDF (PyMuPDF).

Запуск:  python scripts/ingest_pdf.py
Зависимость:  pip install pymupdf

Что делает: для каждой книги находит начала рассказов по заголовку-шапке (24pt),
режет на 17 рассказов, срезает колонтитулы/номера страниц, склеивает переносы,
выделяет курсив (`*…*`, best-effort), маркирует сцены `***` и пишет по одному
очищенному markdown-файлу на рассказ в content/_raw/<book>/NN-slug.md.

ВАЖНО: это полуавтоматическая оснастка. Ручная вычитка каждого рассказа и
простановка themes[] выполняются человеком (см. §11-A1, Шаг 0.3).
"""
from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

try:
    import pymupdf
except ImportError:  # старые версии пакета
    import fitz as pymupdf

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "content" / "_raw"

HEADING_SIZE = 18.0  # >= этого кегля считаем заголовком (тело — 11pt, заголовки — 24pt)


@dataclass
class Book:
    id: str
    pdf: str
    year: int
    titles: list[str]
    printed_starts: list[int]  # печатные номера стартовых страниц (для сверки)


# Оглавления и стартовые страницы сверены по «Содержанию» обоих PDF (разведка 0.1).
BOOKS = [
    Book(
        id="kolizey",
        pdf="source/Kolizey-22.pdf",
        year=2022,
        titles=[
            "Однажды утром", "Встреча", "Цвет Надежды", "Завтрак",
            "Время и его причуды", "Прометей", "Внутренний огонь", "Скамейка",
            "Колодец", "Паритет", "Обыкновенный вечер", "Ночь, дорога, навигатор",
            "Путь в никуда", "Изумрудный город... сейчас", "Отражение",
            "Свет мой, зеркальце...", "Переподготовка зла, или Что-то новое…",
        ],
        printed_starts=[7, 11, 17, 25, 35, 57, 67, 77, 83, 89, 95, 101, 107, 113, 119, 123, 133],
    ),
    Book(
        id="koleso",
        pdf="source/Koleso_Sansarj_FINAL.pdf",
        year=2023,
        titles=[
            "Девять жизней", "Фонарь", "Крик", "Фонтан", "Всему своё время",
            "Неизбежное", "Солёные слёзы", "Fake It", "Звук", "Жест", "Облака",
            "Триптих", "Букет", "Экземпляр", "Корзина \\ Recycle Bin",
            "Наблюдатель", "Дорога",
        ],
        printed_starts=[7, 15, 25, 35, 43, 57, 65, 73, 81, 89, 97, 103, 111, 123, 147, 157, 167],
    ),
]


@dataclass
class Story:
    order: int
    title: str
    slug: str
    start_page: int
    end_page: int
    warnings: list[str] = field(default_factory=list)


# ---- транслитерация / slug --------------------------------------------------

_TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}


def slugify(order: int, title: str) -> str:
    """'Корзина \\ Recycle Bin' (15) -> '15-korzina-recycle-bin'."""
    s = "".join(_TRANSLIT.get(ch, ch) for ch in title.lower())
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return f"{order:02d}-{s}"


# ---- поиск границ рассказов -------------------------------------------------

def _norm(s: str) -> str:
    """Нормализация для сравнения заголовков: только буквы/цифры, нижний регистр."""
    return re.sub(r"[\s\W_]+", "", s, flags=re.UNICODE).lower()


def heading_text(page) -> str:
    """Склейка всех спанов заголовочного кегля на странице (заголовок может быть в 2 строки)."""
    parts = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                if span["size"] >= HEADING_SIZE and span["text"].strip():
                    parts.append(span["text"])
    return " ".join(parts)


def find_story_starts(doc, titles: list[str]) -> list[int]:
    """Физические страницы начала каждого рассказа: заголовок-шапка совпадает с
    очередным заглавием оглавления (по порядку). Книга-титул и 'Содержание' не
    совпадают ни с одним заглавием и пропускаются автоматически."""
    starts: list[int] = []
    ti = 0
    for i in range(doc.page_count):
        if ti >= len(titles):
            break
        h = _norm(heading_text(doc[i]))
        t = _norm(titles[ti])
        if h and t and (h == t or h.startswith(t) or t.startswith(h)):
            starts.append(i)
            ti += 1
    return starts


def find_back_matter(doc, after: int) -> int:
    """Первая страница 'Содержание' после последнего рассказа — конец тела книги."""
    for i in range(after + 1, doc.page_count):
        if _norm(heading_text(doc[i])) == _norm("Содержание"):
            return i
    return doc.page_count


# ---- извлечение и чистка текста ---------------------------------------------

def _is_italic(span) -> bool:
    return bool(span["flags"] & 2) or "ital" in span["font"].lower() or "obli" in span["font"].lower()


def line_md(line) -> str:
    """Текст строки; курсивные участки оборачиваются в *…* (звёздочки жмутся к слову)."""
    spans = [(s["text"], _is_italic(s)) for s in line.get("spans", []) if s["text"]]
    merged: list[list] = []
    for txt, it in spans:
        if merged and merged[-1][1] == it:
            merged[-1][0] += txt
        else:
            merged.append([txt, it])
    out = []
    for txt, it in merged:
        if it and txt.strip():
            lead = txt[: len(txt) - len(txt.lstrip())]
            trail = txt[len(txt.rstrip()) :]
            out.append(f"{lead}*{txt.strip()}*{trail}")
        else:
            out.append(txt)
    return "".join(out)


# приставки/суффиксы, где дефис в конце строки настоящий (бережём «что-то», «по-» наречия)
_KEEP_HYPHEN_NEXT = re.compile(r"^(то|либо|нибудь|таки|ка)\b", re.UNICODE)


def join_lines(parts: list[str]) -> str:
    """Склейка строк абзаца с разбором переносов."""
    if not parts:
        return ""
    out = parts[0]
    for nxt in parts[1:]:
        if out.endswith("­"):  # мягкий перенос
            out = out[:-1] + nxt
        elif out.endswith("-") and len(out) >= 2 and out[-2].isalpha() and nxt[:1].islower():
            if _KEEP_HYPHEN_NEXT.match(nxt):
                out = out + nxt           # настоящий дефис: «что-то»
            else:
                out = out[:-1] + nxt      # перенос: «оглядыва-/ться» -> «оглядываться»
        else:
            out = out + " " + nxt
    return out


_SCENE_CHARS = set("*∗﹡＊⁎•")


def _raw_line(line) -> str:
    return "".join(s["text"] for s in line.get("spans", [])).strip()


def _line_max_size(line) -> float:
    return max((s["size"] for s in line.get("spans", [])), default=0.0)


def is_scene(raw: str) -> bool:
    """Строка-разделитель сцен: только звёздочки (с пробелами), напр. '* * *' или '***'."""
    compact = raw.replace(" ", "")
    return len(compact) >= 3 and set(compact) <= _SCENE_CHARS


INDENT_MIN = 8.0  # порог втяжки абзаца (поле ~39.7pt, втяжка ~56.7pt → разница ~17pt)


def _page_lines(page) -> list:
    """Все непустые строки страницы в порядке чтения (сверху вниз, слева направо)."""
    lines = []
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            if _raw_line(l):
                lines.append(l)
    lines.sort(key=lambda l: (round(l["bbox"][1]), round(l["bbox"][0])))
    return lines


def page_to_paragraphs(page, is_start: bool, base_x: float) -> list[str]:
    """Абзацы страницы. Новый абзац — по ВТЯЖКЕ первой строки (так в книге заданы и
    обычные абзацы, и реплики диалога). Срезаются строки заголовка (на стартовой
    странице) и одиночные колонцифры (по СЫРОМУ тексту — до обёртки курсива!);
    строка-разделитель сцен -> '***'."""
    out: list[str] = []
    buf: list[str] = []

    def flush() -> None:
        if buf:
            out.append(join_lines(buf))
            buf.clear()

    for line in _page_lines(page):
        raw = _raw_line(line)
        if is_start and _line_max_size(line) >= HEADING_SIZE:
            continue  # строка заголовка рассказа
        if re.fullmatch(r"\d{1,3}", raw):
            continue  # колонцифра (в т.ч. курсивная)
        if is_scene(raw):
            flush()
            out.append("***")
            continue
        if buf and line["bbox"][0] >= base_x + INDENT_MIN:
            flush()  # втяжка => новый абзац
        buf.append(line_md(line))
    flush()
    return out


def _cleanup_scenes(paragraphs: list[str]) -> list[str]:
    """Убирает ведущие/хвостовые и сдвоенные разделители сцен."""
    res: list[str] = []
    for p in paragraphs:
        if p == "***" and (not res or res[-1] == "***"):
            continue
        res.append(p)
    while res and res[-1] == "***":
        res.pop()
    return res


_TERMINAL = tuple(".!?…»\")")


def _is_continuation(prev: str, nxt: str) -> bool:
    """Абзац с предыдущей страницы продолжается на следующей (а не новый абзац/реплика)."""
    if prev == "***" or nxt == "***":
        return False
    if not prev or not nxt:
        return False
    if nxt[:1] in "—–-" or nxt[:1].isupper():  # реплика диалога или новое предложение
        return False
    return not prev.rstrip().endswith(_TERMINAL)


def normalize_typography(text: str) -> str:
    """Лёгкая нормализация (микротипографику делает typograf на сборке, §2.1)."""
    text = text.replace("­", "")        # остаточные мягкие переносы
    text = re.sub(r"[ \t]+", " ", text)       # схлопнуть пробелы
    text = re.sub(r" *\n *", "\n", text)      # обрезать пробелы у переводов строк
    text = re.sub(r"\n{3,}", "\n\n", text)    # максимум одна пустая строка
    return text.strip() + "\n"


def body_left_margin(doc) -> float:
    """Левое поле книги = минимальный x0 строк тела (кегль ~11pt). Втяжка абзаца — правее."""
    xs = []
    for i in range(doc.page_count):
        for b in doc[i].get_text("dict")["blocks"]:
            for l in b.get("lines", []):
                if 10 <= _line_max_size(l) <= 12 and not re.fullmatch(r"\d{1,3}", _raw_line(l)):
                    xs.append(l["bbox"][0])
    return min(xs) if xs else 0.0


def extract_story(doc, story: Story, base_x: float) -> str:
    """Полный пайплайн одного рассказа -> markdown ('# Заглавие' + тело)."""
    paragraphs: list[str] = []
    for i in range(story.start_page, story.end_page):
        page_paras = page_to_paragraphs(doc[i], i == story.start_page, base_x)
        for j, p in enumerate(page_paras):
            if j == 0 and i > story.start_page and paragraphs and _is_continuation(paragraphs[-1], p):
                paragraphs[-1] = join_lines([paragraphs[-1], p])
            else:
                paragraphs.append(p)
    paragraphs = _cleanup_scenes(paragraphs)
    body = normalize_typography("\n\n".join(paragraphs))
    return f"# {story.title}\n\n{body}"


def write_raw(book_id: str, story: Story, md: str) -> Path:
    out_dir = RAW / book_id
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{story.slug}.md"
    path.write_text(md, encoding="utf-8", newline="\n")
    return path


def first_body_line(md: str) -> str:
    for line in md.splitlines():
        if line.strip() and not line.startswith("#"):
            return line.strip()
    return ""


def build_stories(doc, book: Book) -> list[Story]:
    starts = find_story_starts(doc, book.titles)
    if len(starts) != len(book.titles):
        raise SystemExit(
            f"[{book.id}] найдено {len(starts)} заголовков из {len(book.titles)} — проверьте детекцию"
        )
    back = find_back_matter(doc, starts[-1])
    bounds = starts + [back]
    stories: list[Story] = []
    for idx, title in enumerate(book.titles):
        order = idx + 1
        st = Story(
            order=order,
            title=title,
            slug=slugify(order, title),
            start_page=starts[idx],
            end_page=bounds[idx + 1],
        )
        expected = book.printed_starts[idx] - 1  # печатная = физическая + 1
        if st.start_page != expected:
            st.warnings.append(f"стартовая страница {st.start_page} != ожидаемой {expected}")
        stories.append(st)
    return stories


def main() -> None:
    total = 0
    print(f"{'book':8} {'NN':2} {'slug':32} {'pages':>9} {'words':>6}  first line / warnings")
    print("-" * 100)
    for book in BOOKS:
        doc = pymupdf.open(str(ROOT / book.pdf))
        base_x = body_left_margin(doc)
        stories = build_stories(doc, book)
        for st in stories:
            md = extract_story(doc, st, base_x)
            write_raw(book.id, st, md)
            total += 1
            words = len(re.findall(r"\w+", md, flags=re.UNICODE))
            warn = ("  ⚠ " + "; ".join(st.warnings)) if st.warnings else ""
            pages = f"{st.start_page}-{st.end_page - 1}"
            print(f"{book.id:8} {st.order:02d} {st.slug:32} {pages:>9} {words:>6}  {first_body_line(md)[:40]}{warn}")
        doc.close()
    print("-" * 100)
    print(f"Готово: {total} файлов в {RAW.relative_to(ROOT)} (ожидалось 34).")


if __name__ == "__main__":
    main()
