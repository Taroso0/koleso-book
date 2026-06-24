"""Шаг 0.3 — генерация content/stories/*.mdx из _raw + извлечение иллюстраций + чек-лист.

Запуск:  python scripts/build_mdx.py   (после Шага 0.1; PyMuPDF уже установлен)

Для каждого рассказа:
  - извлекает полностраничную плашку со страницы (start_page - 1) в
    public/illustrations/<book>/<slug>.<ext>;
  - собирает content/stories/<slug>.mdx: frontmatter (slug, title, book, order,
    firstLine, illustration?, themes: []) + тело из _raw (без строки '# Заглавие').
Плюс docs/proofreading-checklist.md.

ВАЖНО: themes[] оставлены пустыми — их проставляет человек при вычитке (§11-A1).
"""
from __future__ import annotations

import re
import sys
from io import BytesIO
from pathlib import Path

try:
    import pymupdf
except ImportError:
    import fitz as pymupdf

try:
    from PIL import Image  # для конвертации плашек в WebP (исходное разрешение)
    _HAVE_PIL = True
except ImportError:
    _HAVE_PIL = False

WEBP_QUALITY = 90

# переиспользуем логику Шага 0.1
sys.path.insert(0, str(Path(__file__).resolve().parent))
from ingest_pdf import BOOKS, ROOT, build_stories  # noqa: E402

RAW = ROOT / "content" / "_raw"
STORIES = ROOT / "content" / "stories"
ILLUS = ROOT / "public" / "illustrations"
CHECKLIST = ROOT / "docs" / "proofreading-checklist.md"

MIN_ILLUSTRATION_AREA = 150_000  # пикс² — отсечь мелкие декоративные картинки


def extract_illustration(doc, page_index: int, dest_noext: Path) -> str | None:
    """Сохранить крупнейшее изображение страницы в dest_noext.<ext>. Вернуть имя файла или None."""
    if not (0 <= page_index < doc.page_count):
        return None
    best = None
    best_area = 0
    for img in doc[page_index].get_images(full=True):
        data = doc.extract_image(img[0])
        area = data["width"] * data["height"]
        if area > best_area:
            best_area, best = area, data
    if not best or best_area < MIN_ILLUSTRATION_AREA:
        return None
    dest_noext.parent.mkdir(parents=True, exist_ok=True)
    if _HAVE_PIL:
        # WebP в исходном разрешении — компактно и дружит с next/image.
        # Оригиналы всегда воспроводимы из /source повторным запуском.
        img = Image.open(BytesIO(best["image"]))
        dest = dest_noext.with_suffix(".webp")
        img.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)
    else:
        dest = dest_noext.with_suffix("." + best["ext"])
        dest.write_bytes(best["image"])
    return dest.name


def read_raw(book_id: str, slug: str) -> str:
    return (RAW / book_id / f"{slug}.md").read_text(encoding="utf-8")


def body_without_title(raw: str) -> str:
    lines = raw.split("\n")
    if lines and lines[0].startswith("# "):
        lines = lines[1:]
    return "\n".join(lines).strip() + "\n"


def first_line_event(body: str) -> str:
    """Первая строка-событие: первое предложение первого абзаца (без курсивных *)."""
    para = next((p for p in body.split("\n\n") if p.strip()), "")
    para = para.replace("*", "").strip()
    m = re.match(r"(.{1,200}?[.!?…»])(?:\s|$)", para)
    return (m.group(1) if m else para[:160]).strip()


def yaml_dq(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def write_mdx(book_id: str, story, first_line: str, illustration: str | None, body: str) -> None:
    fm = [
        "---",
        f'slug: "{yaml_dq(story.slug)}"',
        f'title: "{yaml_dq(story.title)}"',
        f'book: "{book_id}"',
        f"order: {story.order}",
        f'firstLine: "{yaml_dq(first_line)}"',
    ]
    if illustration:
        fm.append(f'illustration: "{illustration}"')
    fm.append("themes: [] # TODO: проставить вручную при вычитке")
    fm.append("---")
    STORIES.mkdir(parents=True, exist_ok=True)
    (STORIES / f"{story.slug}.mdx").write_text(
        "\n".join(fm) + "\n\n" + body, encoding="utf-8", newline="\n"
    )


def write_checklist(by_book: dict) -> None:
    lines = [
        "# Чек-лист вычитки рассказов",
        "",
        "Сгенерировано Шагом 0.3. По каждому рассказу: сверить текст с книгой и",
        "проставить `themes[]` в frontmatter `content/stories/<slug>.mdx`.",
        "",
    ]
    for book in BOOKS:
        title = {"kolizey": "Колизей (2022)", "koleso": "Колесо Сансары (2023)"}.get(book.id, book.id)
        lines.append(f"## {title}")
        lines.append("")
        for order, story_title, slug in by_book[book.id]:
            lines.append(f"- {order:02d} «{story_title}» — [ ] вычитан · [ ] темы проставлены  `{slug}`")
        lines.append("")
    CHECKLIST.parent.mkdir(parents=True, exist_ok=True)
    CHECKLIST.write_text("\n".join(lines), encoding="utf-8", newline="\n")


def main() -> None:
    by_book: dict = {}
    print(f"{'book':8} {'NN':2} {'slug':32} {'илл.':>5}  firstLine")
    print("-" * 96)
    for book in BOOKS:
        doc = pymupdf.open(str(ROOT / book.pdf))
        stories = build_stories(doc, book)
        by_book[book.id] = []
        for st in stories:
            raw = read_raw(book.id, st.slug)
            body = body_without_title(raw)
            first = first_line_event(body)
            name = extract_illustration(doc, st.start_page - 1, ILLUS / book.id / st.slug)
            illustration = f"/illustrations/{book.id}/{name}" if name else None
            write_mdx(book.id, st, first, illustration, body)
            by_book[book.id].append((st.order, st.title, st.slug))
            print(f"{book.id:8} {st.order:02d} {st.slug:32} {'+' if name else '—':>5}  {first[:44]}")
        doc.close()
    write_checklist(by_book)
    total = sum(len(v) for v in by_book.values())
    print("-" * 96)
    print(f"Готово: {total} .mdx в {STORIES.relative_to(ROOT)}, плашки в {ILLUS.relative_to(ROOT)}, чек-лист {CHECKLIST.relative_to(ROOT)}.")


if __name__ == "__main__":
    main()
