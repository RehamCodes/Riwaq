"use client";

import { useEffect, useRef } from "react";
import { Video } from "lucide-react";
import {
  addMinutes,
  formatHour,
  formatTime,
  isSameDay,
  minutesIntoDay,
  weekdayShort,
} from "./date-utils";
import { canJoin, eventColors, type ClassEvent } from "./events";

const HOUR_HEIGHT = 56;
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const MIN_EVENT_HEIGHT = 22;

type Positioned = { event: ClassEvent; lane: number; lanes: number };

// Side-by-side lanes for overlapping events, like Teams.
function layoutDay(events: ClassEvent[]): Positioned[] {
  const sorted = [...events].sort(
    (a, b) =>
      a.start.getTime() - b.start.getTime() ||
      b.end.getTime() - a.end.getTime(),
  );
  const result: Positioned[] = [];
  let cluster: Positioned[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    cluster.forEach((p) => (p.lanes = laneEnds.length));
    result.push(...cluster);
    cluster = [];
    laneEnds = [];
    clusterEnd = -Infinity;
  };

  for (const event of sorted) {
    const start = event.start.getTime();
    const end = event.end.getTime();
    if (cluster.length && start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    cluster.push({ event, lane, lanes: 0 });
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();
  return result;
}

export default function TimeGridView({
  days,
  events,
  now,
  onSelect,
  onCreate,
}: {
  days: Date[];
  events: ClassEvent[];
  now: Date;
  onSelect: (event: ClassEvent) => void;
  onCreate: (start: Date) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const showsToday = days.some((d) => isSameDay(d, now));

  // Open scrolled to the current time, or to the start of the school day.
  useEffect(() => {
    const hour = showsToday ? Math.min(now.getHours() - 1, 16) : 7;
    scrollRef.current?.scrollTo({ top: Math.max(hour, 0) * HOUR_HEIGHT });
    // Only on mount; later clock ticks shouldn't move the user's scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gridCols = {
    gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
  };
  const minWidth = days.length > 1 ? days.length * 96 : undefined;

  function handleSlotClick(day: Date, e: React.MouseEvent<HTMLDivElement>) {
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const halfHours = Math.floor((y / HOUR_HEIGHT) * 2);
    onCreate(addMinutes(day, halfHours * 30));
  }

  return (
    <div ref={scrollRef} className="relative flex-1 overflow-auto">
      <div style={{ minWidth }}>
        {/* Day headers */}
        <div className="sticky top-0 z-30 flex border-b border-slate-200 bg-white">
          <div className="w-14 shrink-0 md:w-16" />
          <div className="grid flex-1" style={gridCols}>
            {days.map((day) => {
              const today = isSameDay(day, now);
              return (
                <div
                  key={day.toISOString()}
                  className="flex items-baseline gap-2 border-l border-slate-100 px-3 py-2"
                >
                  <span
                    className={`text-2xl font-semibold ${
                      today ? "text-[#3f5068]" : "text-slate-700"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <span
                    className={`text-sm ${
                      today ? "font-semibold text-[#3f5068]" : "text-slate-500"
                    }`}
                  >
                    {weekdayShort(day)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {/* Today's column marker under the header, like Teams */}
        <div className="flex">
          <div className="w-14 shrink-0 md:w-16" />
          <div className="grid flex-1" style={gridCols}>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`h-0.5 ${isSameDay(day, now) ? "bg-[#3f5068]" : ""}`}
              />
            ))}
          </div>
        </div>

        {/* Time grid */}
        <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
          <div className="relative w-14 shrink-0 md:w-16">
            {HOURS.slice(1).map((h) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-slate-400"
                style={{ top: h * HOUR_HEIGHT }}
              >
                {formatHour(h)}
              </span>
            ))}
          </div>

          <div className="relative grid flex-1" style={gridCols}>
            {/* Hour and half-hour lines */}
            <div className="pointer-events-none absolute inset-0">
              {HOURS.map((h) => (
                <div key={h}>
                  <div
                    className="absolute inset-x-0 border-t border-slate-200"
                    style={{ top: h * HOUR_HEIGHT }}
                  />
                  <div
                    className="absolute inset-x-0 border-t border-dashed border-slate-100"
                    style={{ top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                  />
                </div>
              ))}
            </div>

            {days.map((day) => {
              const dayEvents = events.filter((e) => isSameDay(e.start, day));
              const today = isSameDay(day, now);
              return (
                <div
                  key={day.toISOString()}
                  onClick={(e) => handleSlotClick(day, e)}
                  className="relative cursor-pointer border-l border-slate-100"
                >
                  {layoutDay(dayEvents).map(({ event, lane, lanes }) => {
                    const top =
                      (minutesIntoDay(event.start) / 60) * HOUR_HEIGHT;
                    const height = Math.max(
                      ((event.end.getTime() - event.start.getTime()) /
                        3_600_000) *
                        HOUR_HEIGHT,
                      MIN_EVENT_HEIGHT,
                    );
                    const joinable = canJoin(event, now);
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(event);
                        }}
                        className={`absolute z-10 flex flex-col overflow-hidden rounded-md border-l-4 px-2 py-1 text-left text-xs transition-colors ${
                          eventColors[event.color].block
                        } ${event.end < now ? "opacity-60" : ""}`}
                        style={{
                          top: top + 1,
                          height: height - 2,
                          left: `calc(${(lane / lanes) * 100}% + 2px)`,
                          width: `calc(${100 / lanes}% - 4px)`,
                        }}
                      >
                        <span className="truncate font-semibold">
                          {event.title}
                        </span>
                        {height >= 44 && (
                          <span className="truncate opacity-80">
                            {formatTime(event.start)} – {formatTime(event.end)}
                          </span>
                        )}
                        {height >= (joinable ? 92 : 64) && event.teacher && (
                          <span className="truncate opacity-80">
                            {event.teacher}
                          </span>
                        )}
                        {joinable && height >= 44 && (
                          <span className="mt-auto inline-flex w-fit items-center gap-1 rounded bg-[#3f5068] px-1.5 py-0.5 text-[11px] font-medium text-white">
                            <Video className="size-3" />
                            Join
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {today && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-rose-500"
                      style={{ top: (minutesIntoDay(now) / 60) * HOUR_HEIGHT }}
                    >
                      <span className="absolute -top-[5px] -left-[5px] size-2 rounded-full bg-rose-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
