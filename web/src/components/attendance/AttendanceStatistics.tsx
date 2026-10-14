"use client";

import { useState } from "react";
import { ChartSpline, Table } from "lucide-react";
import AttendanceChart from "./AttendanceChart";
import {
  ACCENT,
  ACCENT_SOFT,
  ranges,
  statistics,
  type Range,
} from "./attendance-data";
import CardTitle from "./CardTitle";

export default function AttendanceStatistics() {
  const [range, setRange] = useState<Range>("1Y");
  const [showTable, setShowTable] = useState(false);
  const data = statistics(range);

  return (
    <section
      id="attendance-statistics"
      className="scroll-mt-4 rounded-2xl bg-white p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <CardTitle icon={ChartSpline}>Attendance Statistics</CardTitle>
        <div
          role="group"
          aria-label="Time range"
          className="ml-auto flex rounded-lg bg-brand-soft p-0.5"
        >
          {ranges.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-label={label}
              aria-pressed={range === value}
              onClick={() => setRange(value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                range === value
                  ? "bg-white text-brand shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <AttendanceChart data={data} showTable={showTable} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs whitespace-nowrap text-slate-600">
        {[
          [data.current.name, ACCENT],
          [data.previous.name, ACCENT_SOFT],
        ].map(([name, color]) => (
          <span key={name} className="flex items-center gap-1.5">
            <span
              className="h-0.5 w-4 rounded-full"
              style={{ background: color }}
            />
            {name}
          </span>
        ))}
        <span className="text-slate-400">Attendance rate</span>
        <button
          type="button"
          aria-pressed={showTable}
          onClick={() => setShowTable((v) => !v)}
          className="ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          {showTable ? (
            <ChartSpline className="size-3.5" />
          ) : (
            <Table className="size-3.5" />
          )}
          {showTable ? "Chart" : "Table"}
        </button>
      </div>
    </section>
  );
}
