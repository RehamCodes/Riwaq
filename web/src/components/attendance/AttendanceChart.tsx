"use client";

import { useEffect, useRef, useState } from "react";
import { ACCENT, ACCENT_SOFT, type Statistics } from "./attendance-data";
import { smoothPath } from "./smooth-path";

const HEIGHT = 260;
const PAD = { top: 28, right: 20, bottom: 30, left: 44 };

const percent = (v: number) => `${v.toFixed(1)}%`;

export default function AttendanceChart({
  data,
  showTable,
}: {
  data: Statistics;
  showTable: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { labels, current, previous } = data;
  const all = [...current.values, ...previous.values];
  // Rates sit near the top, so start the axis just below the lowest value.
  const lo = Math.max(0, Math.floor((Math.min(...all) - 3) / 5) * 5);
  const hi = 100;
  const step = hi - lo > 30 ? 10 : 5;
  const ticks = Array.from(
    { length: (hi - lo) / step + 1 },
    (_, i) => lo + i * step,
  );

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (labels.length > 1 ? (i * plotW) / (labels.length - 1) : 0);
  const y = (v: number) => PAD.top + ((hi - v) / (hi - lo)) * plotH;
  // Skip every other x label when they'd crowd (e.g. 12 months on a phone).
  const labelEvery = plotW / labels.length < 44 ? 2 : 1;
  const pointsOf = (values: number[]) =>
    values.map((v, i) => [x(i), y(v)] as [number, number]);

  const currentLine = smoothPath(pointsOf(current.values));
  const previousLine = smoothPath(pointsOf(previous.values));
  const area = `${currentLine}L${x(labels.length - 1)},${y(lo)}L${x(0)},${y(lo)}Z`;

  // Label only the peak and the latest value, not every point.
  const last = current.values.length - 1;
  const peak = current.values.indexOf(Math.max(...current.values));
  const labelled = peak === last ? [last] : [peak, last];

  function nearest(clientX: number) {
    const rect = boxRef.current!.getBoundingClientRect();
    const rel = clientX - rect.left - PAD.left;
    const i = Math.round((rel / Math.max(1, plotW)) * (labels.length - 1));
    return Math.min(labels.length - 1, Math.max(0, i));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const delta = e.key === "ArrowLeft" ? -1 : 1;
    setActive((i) =>
      Math.min(labels.length - 1, Math.max(0, (i ?? last) + delta)),
    );
  }

  if (showTable) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="py-2 pr-4 font-medium">Period</th>
              <th className="py-2 pr-4 text-right font-medium">
                {current.name}
              </th>
              <th className="py-2 text-right font-medium">{previous.name}</th>
            </tr>
          </thead>
          <tbody className="text-slate-700 tabular-nums">
            {labels.map((label, i) => (
              <tr key={label} className="border-b border-slate-100">
                <td className="py-1.5 pr-4">{label}</td>
                <td className="py-1.5 pr-4 text-right">
                  {percent(current.values[i])}
                </td>
                <td className="py-1.5 text-right">
                  {percent(previous.values[i])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const tipLeft =
    active === null ? 0 : Math.min(Math.max(x(active), 80), width - 80);

  return (
    <div
      ref={boxRef}
      className="relative"
      style={{ height: HEIGHT }}
      onPointerMove={(e) => width && setActive(nearest(e.clientX))}
      onPointerLeave={() => setActive(null)}
    >
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          tabIndex={0}
          aria-label={`Attendance rate, ${current.name} and ${previous.name}. Use the left and right arrow keys to read values.`}
          onKeyDown={onKeyDown}
          onFocus={() => setActive((i) => i ?? last)}
          onBlur={() => setActive(null)}
          className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="#eef0f3"
              />
              <text
                x={PAD.left - 10}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-slate-400 text-[11px] tabular-nums"
              >
                {t}%
              </text>
            </g>
          ))}
          {labels.map((label, i) =>
            i % labelEvery && i !== active ? null : (
              <text
                key={label}
                x={x(i)}
                y={HEIGHT - 8}
                textAnchor="middle"
                className={`text-[11px] ${
                  i === active ? "fill-slate-700 font-medium" : "fill-slate-400"
                }`}
              >
                {label}
              </text>
            ),
          )}

          <path d={area} fill={ACCENT} opacity={0.08} />
          <path
            d={previousLine}
            fill="none"
            stroke={ACCENT_SOFT}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={currentLine}
            fill="none"
            stroke={ACCENT}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {active !== null && (
            <line
              x1={x(active)}
              x2={x(active)}
              y1={PAD.top - 8}
              y2={y(lo)}
              stroke="#cbd5e1"
            />
          )}

          {/* Markers at the labelled points and at the hovered period. */}
          {[
            ...new Set([...labelled, ...(active === null ? [] : [active])]),
          ].map((i) => (
            <g key={i}>
              {i === active && (
                <circle
                  cx={x(i)}
                  cy={y(previous.values[i])}
                  r={5}
                  fill={ACCENT_SOFT}
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
              <circle
                cx={x(i)}
                cy={y(current.values[i])}
                r={5}
                fill={ACCENT}
                stroke="#fff"
                strokeWidth={2}
              />
            </g>
          ))}

          {active === null &&
            labelled.map((i) => {
              const text = percent(current.values[i]);
              const w = text.length * 6.5 + 12;
              const cx = Math.min(
                Math.max(x(i), PAD.left + w / 2),
                width - PAD.right - w / 2,
              );
              return (
                <g
                  key={i}
                  transform={`translate(${cx},${y(current.values[i]) - 20})`}
                >
                  <rect
                    x={-w / 2}
                    y={-10}
                    width={w}
                    height={20}
                    rx={6}
                    fill="#e6ecf5"
                  />
                  <text
                    textAnchor="middle"
                    dy="0.35em"
                    className="fill-slate-700 text-[11px] font-medium tabular-nums"
                  >
                    {text}
                  </text>
                </g>
              );
            })}
        </svg>
      )}

      {active !== null && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-10 w-40 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: tipLeft }}
        >
          <p className="mb-1 text-slate-500">{labels[active]}</p>
          {[
            [current, ACCENT],
            [previous, ACCENT_SOFT],
          ].map(([series, color]) => {
            const s = series as Statistics["current"];
            return (
              <p key={s.name} className="flex items-center gap-2">
                <span
                  className="h-0.5 w-3 rounded-full"
                  style={{ background: color as string }}
                />
                <span className="font-semibold text-slate-800 tabular-nums">
                  {percent(s.values[active])}
                </span>
                <span className="text-slate-500">{s.name}</span>
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
