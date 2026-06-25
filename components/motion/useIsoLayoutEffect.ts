import { useEffect, useLayoutEffect } from "react";

// useLayoutEffect на клиенте, useEffect на сервере — без SSR-предупреждения.
// Нужен моушн-примитивам: выставить from-состояние ДО отрисовки (без вспышки).
export const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
