"use client";

import { useRef } from "react";
import { ChevronsLeftRight } from "lucide-react";

// A vertical drag handle for resizing a panel's width. Place it inside a
// `relative` panel; it sits on the panel's right border. Also works with the
// keyboard (←/→, Shift for bigger steps, Home/End) and double-click resets.
export function ResizeHandle({
  value,
  min,
  max,
  defaultValue,
  onChange,
  label,
  className = "",
}: {
  value: number;
  min: number;
  max: number;
  defaultValue?: number;
  onChange: (value: number) => void;
  label: string;
  className?: string;
}) {
  const drag = useRef<{ startX: number; startValue: number } | null>(null);
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v)));

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startValue: value };
    // Keep the resize cursor and stop text selection while dragging.
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    onChange(clamp(drag.current.startValue + e.clientX - drag.current.startX));
  }

  function endDrag() {
    drag.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 48 : 16;
    const next = {
      ArrowLeft: value - step,
      ArrowRight: value + step,
      Home: min,
      End: max,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onChange(clamp(next));
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
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
      className={`group absolute inset-y-0 -right-1.5 z-20 w-3 cursor-col-resize touch-none focus-visible:outline-none ${className}`}
    >
      <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 transition-colors group-hover:bg-[#3f5068]/50 group-focus-visible:bg-[#3f5068] group-active:bg-[#3f5068]" />
      <span className="absolute top-1/2 left-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100">
        <ChevronsLeftRight className="size-3.5" />
      </span>
    </div>
  );
}
