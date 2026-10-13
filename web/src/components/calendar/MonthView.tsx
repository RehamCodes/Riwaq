"use client";

import { formatTime, isSameDay, weekdayShort } from "./date-utils";
import { eventColors, type ClassEvent } from "./events";

const MAX_VISIBLE = 3;

export default function MonthView({
  days,
  month,
  events,
  now,
  onSelect,
  onOpenDay,
}: {
  days: Date[];
  month: number;
  events: ClassEvent[];
  now: Date;
  onSelect: (event: ClassEvent) => void;
  onOpenDay: (day: Date) => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="flex min-h-full min-w-[640px] flex-1 flex-col">
        <div className="grid grid-cols-7 border-b border-slate-200">
          {days.slice(0, 7).map((d) => (
            <div
              key={d.getDay()}
              className="px-3 py-2 text-xs font-medium text-slate-500"
            >
              {weekdayShort(d)}
            </div>
          ))}
        </div>

        <div className="grid flex-1 auto-rows-fr grid-cols-7">
          {days.map((day) => {
            const dayEvents = events
              .filter((e) => isSameDay(e.start, day))
              .sort((a, b) => a.start.getTime() - b.start.getTime());
            const hidden = dayEvents.length - MAX_VISIBLE;
            const today = isSameDay(day, now);
            const inMonth = day.getMonth() === month;

            return (
              <div
                key={day.toISOString()}
                className={`flex min-h-20 flex-col gap-0.5 border-r border-b border-slate-100 p-1 ${
                  inMonth ? "" : "bg-slate-50/70"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onOpenDay(day)}
                  aria-label={day.toDateString()}
                  className={`mb-0.5 flex size-7 items-center justify-center self-start rounded-full text-sm hover:bg-slate-100 ${
                    today
                      ? "bg-[#3f5068] font-semibold text-white hover:bg-[#3f5068]"
                      : inMonth
                        ? "text-slate-700"
                        : "text-slate-400"
                  }`}
                >
                  {day.getDate()}
                </button>

                {dayEvents.slice(0, MAX_VISIBLE).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelect(event)}
                    className="flex items-center gap-1.5 rounded px-1 py-0.5 text-left text-xs text-slate-700 hover:bg-slate-100"
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${eventColors[event.color].dot}`}
                    />
                    <span className="shrink-0 text-slate-500">
                      {formatTime(event.start)}
                    </span>
                    <span className="truncate font-medium">{event.title}</span>
                  </button>
                ))}

                {hidden > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenDay(day)}
                    className="rounded px-1 text-left text-xs font-medium text-slate-500 hover:bg-slate-100"
                  >
                    +{hidden} more
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
