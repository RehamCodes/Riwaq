import { useSyncExternalStore } from "react";

// The current time, updated every second, for countdowns and access that
// opens or ends on time. Null while prerendering (see calendar/use-now.ts).
let current: number | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    timer = setInterval(() => {
      current = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
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

export function useClock(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
