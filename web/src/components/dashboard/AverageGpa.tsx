"use client";

import { useState } from "react";
import { ChartColumn } from "lucide-react";
import { Select } from "@/components/ui";
import CardTitle from "@/components/attendance/CardTitle";
import { ACCENT, ACCENT_SOFT } from "@/components/attendance/attendance-data";
import { gpaByMonth, gradeBands, letterOf } from "./dashboard-data";

// The axis runs from the bottom of the F band to 100%.
const LO = 40;
const HI = 100;
const height = (score: number) => `${((score - LO) / (HI - LO)) * 100}%`;

// Previous week wears a hatch so the two bars read apart without color.
const hatch = `repeating-linear-gradient(135deg, ${ACCENT_SOFT} 0 2px, transparent 2px 5px)`;

const months = Object.keys(gpaByMonth).map((m) => ({ value: m, label: m }));

export default function AverageGpa() {
  const [month, setMonth] = useState(months[0].value);
  const [active, setActive] = useState<number | null>(null);
  const { labels, current, previous } = gpaByMonth[month];

  return (
    <section className="flex flex-col rounded-2xl bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <CardTitle icon={ChartColumn}>Average GPA</CardTitle>
        <div className="ml-auto flex items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span
              className="size-3 rounded-sm"
              style={{ background: hatch, outline: `1px solid ${ACCENT_SOFT}` }}
            />
            Previous week
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ background: ACCENT }} />
            This week
          </span>
          <Select
            label="Month"
            value={month}
            onChange={setMonth}
            options={months}
            className="text-xs"
          />
        </div>
      </div>

      <div className="mt-5 flex min-h-56 flex-1 gap-3">
        {/* Letter axis: each letter sits in the middle of its band. */}
        <div className="relative w-4 text-xs text-slate-400">
          {gradeBands.map(({ letter, min }, i) => {
            const top = i === 0 ? HI : gradeBands[i - 1].min;
            const mid = (Math.max(min, LO) + top) / 2;
            return (
              <span
                key={letter}
                className="absolute -translate-y-1/2"
                style={{ bottom: height(mid) }}
              >
                {letter}
              </span>
            );
          })}
        </div>

        <div className="flex flex-1 flex-col">
          <div className="relative flex flex-1 border-b border-slate-200">
            {gradeBands.slice(0, -1).map(({ letter, min }) => (
              <span
                key={letter}
                className="absolute inset-x-0 border-t border-dashed border-slate-100"
                style={{ bottom: height(min) }}
              />
            ))}
            {labels.map((label, i) => (
              <div
                key={label}
                className="relative flex flex-1 items-end justify-center gap-0.5"
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
              >
                <span
                  className="w-3 rounded-t sm:w-5"
                  style={{
                    height: height(previous[i]),
                    background: hatch,
                    opacity: active === null || active === i ? 1 : 0.5,
                  }}
                />
                <span
                  className="w-3 rounded-t sm:w-5"
                  style={{
                    height: height(current[i]),
                    background: ACCENT,
                    opacity: active === null || active === i ? 1 : 0.5,
                  }}
                />
                {active === i && (
                  <div
                    role="tooltip"
                    className="absolute z-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs whitespace-nowrap text-slate-600 shadow-lg"
                    style={{
                      bottom: `calc(${height(Math.max(current[i], previous[i]))} + 8px)`,
                    }}
                  >
                    <p className="mb-1 font-medium text-slate-800">{label}</p>
                    <p>
                      This week:{" "}
                      <span className="font-medium text-slate-800">
                        {letterOf(current[i])}, {current[i]}%
                      </span>
                    </p>
                    <p>
                      Previous:{" "}
                      <span className="font-medium text-slate-800">
                        {letterOf(previous[i])}, {previous[i]}%
                      </span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex text-xs text-slate-500">
            {labels.map((label) => (
              <span key={label} className="flex-1 text-center">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
