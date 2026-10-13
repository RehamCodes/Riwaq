import { toDateInputValue } from "./date-utils";
import { weeklyTimetable } from "./sample-timetable";

export type EventColor =
  "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet";

export type ClassEvent = {
  id: string;
  title: string;
  teacher?: string;
  start: Date;
  end: Date;
  color: EventColor;
  online: boolean;
  // Created in the calendar by the user (can be deleted).
  custom?: boolean;
};

// Full class names so Tailwind can see them.
export const eventColors: Record<EventColor, { block: string; dot: string }> = {
  indigo: {
    block: "border-indigo-500 bg-indigo-50 text-indigo-950 hover:bg-indigo-100",
    dot: "bg-indigo-500",
  },
  emerald: {
    block:
      "border-emerald-500 bg-emerald-50 text-emerald-950 hover:bg-emerald-100",
    dot: "bg-emerald-500",
  },
  amber: {
    block: "border-amber-500 bg-amber-50 text-amber-950 hover:bg-amber-100",
    dot: "bg-amber-500",
  },
  rose: {
    block: "border-rose-500 bg-rose-50 text-rose-950 hover:bg-rose-100",
    dot: "bg-rose-500",
  },
  sky: {
    block: "border-sky-500 bg-sky-50 text-sky-950 hover:bg-sky-100",
    dot: "bg-sky-500",
  },
  violet: {
    block: "border-violet-500 bg-violet-50 text-violet-950 hover:bg-violet-100",
    dot: "bg-violet-500",
  },
};

function at(day: Date, time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

export function timetableFor(days: Date[]): ClassEvent[] {
  return days.flatMap((day) =>
    weeklyTimetable
      .filter((c) => c.weekday === day.getDay())
      .map((c) => ({
        id: `${c.key}-${toDateInputValue(day)}`,
        title: c.title,
        teacher: c.teacher,
        start: at(day, c.start),
        end: at(day, c.end),
        color: c.color,
        online: true,
      })),
  );
}

// Online classes can be joined from 10 minutes before they start.
export function canJoin(event: ClassEvent, now: Date) {
  const t = now.getTime();
  return (
    event.online &&
    t >= event.start.getTime() - 10 * 60_000 &&
    t < event.end.getTime()
  );
}
