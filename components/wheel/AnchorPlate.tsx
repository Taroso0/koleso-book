"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Длинная сторона плашки (работы портретные), px. Общая с WheelCanvas — он считает
// по ней вертикальный сдвиг позиции. Вилка README: 64–96.
export const ANCHOR_PLATE_H = 84;

// Плашка-якорь на «Колесе» (§8, §14) — презентационная (как ThemeNode): позицию и
// состояние (lit/dim/lift) считает WheelCanvas. Паспарту «карточка» + next/image в
// РОДНОЙ палитре (не перекрашиваем: якорь — единственный «инородный» цвет карты,
// осознанно). Не интерактивна: pointer-events:none + aria-hidden — hit-зона у узла.
// Файл не загрузился → плашка убирает себя (без пустой рамки).
export function AnchorPlate({
  src,
  width,
  height,
  left,
  top,
  lit,
  dimmed,
  lift,
}: {
  src: string;
  width: number; // интринсик из манифеста — для расчёта пропорции плашки
  height: number;
  left: string; // проценты контейнера (как карточка-превью)
  top: string;
  lit: boolean;
  dimmed: boolean;
  lift: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  // Отдаём next/image размер отображения (а не интринсик 1392px), иначе он тянул бы
  // большой исходник и масштабировал в 84px. Пропорция — из манифеста.
  const displayW = Math.round(ANCHOR_PLATE_H * (width / height));
  return (
    <div
      className={cn(
        "wheel-anchor",
        lit && "is-lit",
        dimmed && "is-dim",
        lift && "is-lift",
      )}
      style={{ left, top }}
      aria-hidden
    >
      <div className="wheel-anchor__mat">
        <Image
          src={src}
          width={displayW}
          height={ANCHOR_PLATE_H}
          alt=""
          draggable={false}
          onError={() => setFailed(true)}
        />
      </div>
    </div>
  );
}
