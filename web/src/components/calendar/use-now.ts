import { useMemo, useSyncExternalStore } from "react";

// A shared clock that ticks every 30s. It reads the time only in the
// browser: during prerendering it returns null, because reading the current
// time while prerendering is an error with cacheComponents.
const TICK_MS = 30_000;

let current: number | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    timer = setInterval(() => {
      current = Date.now();
      listeners.forEach((l) => l());
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
      current = null;
    }
  };
}

function getSnapshot() {
  current ??= Date.now();
  return current;
}

function getServerSnapshot() {
  return null;
}

export function useNow(): Date | null {
  const time = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => (time === null ? null : new Date(time)), [time]);
}
