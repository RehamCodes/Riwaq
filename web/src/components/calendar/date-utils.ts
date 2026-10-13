export type CalendarView = "day" | "workweek" | "week" | "month";

// School days shown in "Work week" (0 = Sunday … 6 = Saturday).
export const WORK_DAYS = [0, 1, 2, 3, 4];

const LOCALE = "en-US";

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, amount: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function addMinutes(date: Date, amount: number) {
  return new Date(date.getTime() + amount * 60_000);
}

export function startOfWeek(date: Date) {
  const d = startOfDay(date);
  return addDays(d, -d.getDay());
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function minutesIntoDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function visibleDays(view: CalendarView, anchor: Date): Date[] {
  if (view === "day") return [startOfDay(anchor)];
  if (view === "month") {
    const first = startOfWeek(startOfMonth(anchor));
    return Array.from({ length: 42 }, (_, i) => addDays(first, i));
  }
  const week = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(anchor), i),
  );
  return view === "week"
    ? week
    : week.filter((d) => WORK_DAYS.includes(d.getDay()));
}

export function shiftAnchor(view: CalendarView, anchor: Date, dir: 1 | -1) {
  if (view === "day") return addDays(anchor, dir);
  if (view === "month") return addMonths(anchor, dir);
  return addDays(anchor, 7 * dir);
}

export function rangeLabel(view: CalendarView, days: Date[], anchor: Date) {
  if (view === "month") {
    return anchor.toLocaleDateString(LOCALE, {
      month: "long",
      year: "numeric",
    });
  }
  if (view === "day") {
    return anchor.toLocaleDateString(LOCALE, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  const first = days[0];
  const last = days[days.length - 1];
  if (first.getMonth() === last.getMonth()) {
    const month = first.toLocaleDateString(LOCALE, { month: "long" });
    return `${month} ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`;
  }
  const sameYear = first.getFullYear() === last.getFullYear();
  const from = first.toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const to = last.toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${from} – ${to}`;
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatHour(hour: number) {
  const suffix = hour < 12 ? "AM" : "PM";
  return `${hour % 12 || 12} ${suffix}`;
}

export function weekdayShort(date: Date) {
  return date.toLocaleDateString(LOCALE, { weekday: "short" });
}

export function formatLongDate(date: Date) {
  return date.toLocaleDateString(LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toTimeInputValue(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Next half hour from the given time, e.g. 10:20 → 10:30.
export function nextHalfHour(now: Date) {
  const d = new Date(now);
  d.setSeconds(0, 0);
  return addMinutes(d, 30 - (d.getMinutes() % 30));
}
