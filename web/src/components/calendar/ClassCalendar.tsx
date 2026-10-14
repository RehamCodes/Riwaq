"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  nextHalfHour,
  rangeLabel,
  shiftAnchor,
  startOfDay,
  visibleDays,
  type CalendarView,
} from "./date-utils";
import { timetableFor, type ClassEvent } from "./events";
import { useNow } from "./use-now";
import { addEvent, removeEvent, useCustomEvents } from "./calendar-store";
import TimeGridView from "./TimeGridView";
import MonthView from "./MonthView";
import { EventDetailsDialog, NewClassDialog } from "./dialogs";

const views: { value: CalendarView; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "workweek", label: "Work week" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export default function ClassCalendar() {
  const now = useNow();

  return (
    <section className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-2xl bg-white">
      {now ? (
        <Calendar now={now} />
      ) : (
        // Rendered while prerendering, before the browser's clock is known.
        <div className="flex-1 animate-pulse" aria-busy="true" />
      )}
    </section>
  );
}

function Calendar({ now }: { now: Date }) {
  // Only runs in the browser, so window is safe here.
  const [view, setView] = useState<CalendarView>(() =>
    window.matchMedia("(max-width: 767px)").matches ? "day" : "workweek",
  );
  const [anchor, setAnchor] = useState(() => startOfDay(now));
  const customEvents = useCustomEvents();
  const [selected, setSelected] = useState<ClassEvent | null>(null);
  const [draftStart, setDraftStart] = useState<Date | null>(null);

  const days = useMemo(() => visibleDays(view, anchor), [view, anchor]);
  const events = useMemo(() => {
    const first = days[0].getTime();
    const last = days[days.length - 1].getTime() + 86_400_000;
    const inRange = customEvents.filter(
      (e) => e.start.getTime() >= first && e.start.getTime() < last,
    );
    return [...timetableFor(days), ...inRange];
  }, [days, customEvents]);

  const closeDetails = useCallback(() => setSelected(null), []);
  const closeDraft = useCallback(() => setDraftStart(null), []);

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 md:px-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <CalendarDays className="size-5 text-brand" />
            Calendar
          </h1>
          <button
            type="button"
            onClick={() => setDraftStart(nextHalfHour(now))}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover"
          >
            <Plus className="size-4" />
            New class
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAnchor(startOfDay(now))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Today
          </button>
          <div className="flex">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => setAnchor((a) => shiftAnchor(view, a, -1))}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => setAnchor((a) => shiftAnchor(view, a, 1))}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
          <h2
            aria-live="polite"
            className="text-sm font-semibold text-slate-700 md:text-base"
          >
            {rangeLabel(view, days, anchor)}
          </h2>

          <div
            role="group"
            aria-label="Calendar view"
            className="ml-auto flex rounded-lg bg-brand-soft p-0.5"
          >
            {views.map((v) => (
              <button
                key={v.value}
                type="button"
                aria-pressed={view === v.value}
                onClick={() => setView(v.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium md:text-sm ${
                  view === v.value
                    ? "bg-white text-brand shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "month" ? (
        <MonthView
          days={days}
          month={anchor.getMonth()}
          events={events}
          now={now}
          onSelect={setSelected}
          onOpenDay={(day) => {
            setAnchor(day);
            setView("day");
          }}
        />
      ) : (
        <TimeGridView
          key={view}
          days={days}
          events={events}
          now={now}
          onSelect={setSelected}
          onCreate={setDraftStart}
        />
      )}

      {selected && (
        <EventDetailsDialog
          event={selected}
          now={now}
          onClose={closeDetails}
          onDelete={(event) => {
            removeEvent(event.id);
            setSelected(null);
          }}
        />
      )}
      {draftStart && (
        <NewClassDialog
          initialStart={draftStart}
          onClose={closeDraft}
          onCreate={(event) => {
            addEvent(event);
            setDraftStart(null);
            setAnchor(startOfDay(event.start));
          }}
        />
      )}
    </>
  );
}
