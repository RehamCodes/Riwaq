"use client";

import { useRef } from "react";
import { ChevronsLeftRight, ChevronsUpDown } from "lucide-react";

// A drag handle for resizing a panel. Place it inside a `relative` panel.
// - edge "right" (default): sits on the right border and changes the width.
// - edge "top": sits on the top border and changes the height (dragging up
//   makes the panel taller).
// Also works with the keyboard (arrows, Shift for bigger steps, Home/End) and
// double-click resets.
export function ResizeHandle({
  value,
  min,
  max,
  defaultValue,
  onChange,
  label,
  edge = "right",
  className = "",
}: {
  value: number;
  min: number;
  max: number;
  defaultValue?: number;
  onChange: (value: number) => void;
  label: string;
  edge?: "right" | "top";
  className?: string;
}) {
  const drag = useRef<{ start: number; startValue: number } | null>(null);
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v)));
  const vertical = edge === "right";
  const cursor = vertical ? "col-resize" : "row-resize";

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      start: vertical ? e.clientX : e.clientY,
      startValue: value,
    };
    // Keep the resize cursor and stop text selection while dragging.
    document.body.style.cursor = cursor;
    document.body.style.userSelect = "none";
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const delta = (vertical ? e.clientX : e.clientY) - drag.current.start;
    onChange(clamp(drag.current.startValue + (vertical ? delta : -delta)));
  }

  function endDrag() {
    drag.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 48 : 16;
    const [less, more] = vertical
      ? ["ArrowLeft", "ArrowRight"]
      : ["ArrowDown", "ArrowUp"];
    const next =
      e.key === less
        ? value - step
        : e.key === more
          ? value + step
          : e.key === "Home"
            ? min
            : e.key === "End"
              ? max
              : undefined;
    if (next === undefined) return;
    e.preventDefault();
    onChange(clamp(next));
  }

  const Icon = vertical ? ChevronsLeftRight : ChevronsUpDown;

  return (
    <div
      role="separator"
      aria-orientation={vertical ? "vertical" : "horizontal"}
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onDoubleClick={() => defaultValue !== undefined && onChange(defaultValue)}
      onKeyDown={onKeyDown}
      className={`group absolute z-20 touch-none focus-visible:outline-none ${
        vertical
          ? "inset-y-0 -right-1.5 w-3 cursor-col-resize"
          : "inset-x-0 -top-1.5 h-3 cursor-row-resize"
      } ${className}`}
    >
      <span
        className={`absolute transition-colors group-hover:bg-[#3f5068]/50 group-focus-visible:bg-[#3f5068] group-active:bg-[#3f5068] ${
          vertical
            ? "inset-y-0 left-1/2 w-0.5 -translate-x-1/2"
            : "inset-x-0 top-1/2 h-0.5 -translate-y-1/2"
        }`}
      />
      <span className="absolute top-1/2 left-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100">
        <Icon className="size-3.5" />
      </span>
    </div>
  );
}
