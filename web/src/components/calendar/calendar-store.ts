import { useSyncExternalStore } from "react";
import type { ClassEvent } from "./events";

// Classes and meetings created in the app, shared across pages (e.g. a
// meeting scheduled from Chats shows up in the Classes calendar). Lives in
// memory until the server stores them.
let events: ClassEvent[] = [];
const EMPTY: ClassEvent[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function addEvent(event: ClassEvent) {
  events = [...events, event];
  emit();
}

export function removeEvent(id: string) {
  events = events.filter((e) => e.id !== id);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCustomEvents() {
  return useSyncExternalStore(
    subscribe,
    () => events,
    () => EMPTY,
  );
}
