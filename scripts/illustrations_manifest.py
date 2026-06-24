"""Манифест размеров иллюстраций → content/illustrations.json.

Зачем: <IllustrationPlate> рендерит next/image по динамическому src (путь из
frontmatter), а для отсутствия layout shift (§10) нужны точные width/height.
Размеры читаются из готовых WebP (public/illustrations/<book>/<slug>.webp).

Запуск (после перегенерации иллюстраций в Шаге 0.3):
    python scripts/illustrations_manifest.py
Артефакт детерминирован и коммитится; на сборке сайта Python не требуется.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ILLO_DIR = ROOT / "public" / "illustrations"
OUT = ROOT / "content" / "illustrations.json"


def build() -> dict[str, dict[str, int]]:
    manifest: dict[str, dict[str, int]] = {}
    for path in sorted(ILLO_DIR.glob("*/*.webp")):
        key = f"{path.parent.name}/{path.stem}"  # «<book>/<slug>»
        with Image.open(path) as im:
            w, h = im.size
        manifest[key] = {"width": w, "height": h}
    return manifest


def main() -> None:
    manifest = build()
    OUT.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"{len(manifest)} illustrations -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
