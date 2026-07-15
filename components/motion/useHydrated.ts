"use client";

import { useSyncExternalStore } from "react";

// Гидратация без setState-в-effect: на сервере и в первом клиентском рендере —
// false (совпадает → без hydration-mismatch), после гидратации — true. Штатная
// замена паттерну «прочитать клиентское значение (localStorage/устройство) после
// маунта через useState + useEffect». Значение стабильно, стор не меняется —
// подписка пустая.
const subscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true, // клиент после гидратации
    () => false, // сервер / первый рендер
  );
}
