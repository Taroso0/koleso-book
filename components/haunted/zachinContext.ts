"use client";

import { createContext, useContext } from "react";

// Лёгкий контекст «зачина» (без тяжёлых импортов SplitText) — чтобы потребители
// (например, WheelCanvas) не тянули кинетику в свой чанк. Реализация — в
// ZachinProvider (только в layout «Витрины»).
export type OpeningStory = {
  firstLine: string;
  slug: string;
  book: string;
  title: string;
};

export type ZachinApi = { playOpening: (s: OpeningStory) => void };

export const ZachinContext = createContext<ZachinApi | null>(null);

export function useZachin(): ZachinApi | null {
  return useContext(ZachinContext);
}
