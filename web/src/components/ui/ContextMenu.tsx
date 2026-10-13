"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";

export type MenuEntry =
  | {
      label: string;
      icon?: LucideIcon;
      // Shows a color dot instead of an icon.
      swatch?: string;
      onSelect: () => void;
      danger?: boolean;
      disabled?: boolean;
    }
  | "separator";

// A floating menu at a screen position (e.g. a right-click). Closes on
// outside click, Escape, scroll or resize; ↑/↓ move between items.
export function ContextMenu({
  x,
  y,
  items,
  label,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuEntry[];
  label: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Keep the menu inside the viewport and focus the first item.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    el.style.left = `${Math.max(8, Math.min(x, window.innerWidth - width - 8))}px`;
    el.style.top = `${Math.max(8, Math.min(y, window.innerHeight - height - 8))}px`;
    el.querySelector<HTMLButtonElement>(
      "[role=menuitem]:not(:disabled)",
    )?.focus();
  }, [x, y]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  function onMenuKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const buttons = [
      ...(ref.current?.querySelectorAll<HTMLButtonElement>(
        "[role=menuitem]:not(:disabled)",
      ) ?? []),
    ];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === "ArrowDown" ? i + 1 : i - 1;
    buttons[(next + buttons.length) % buttons.length]?.focus();
  }

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      onKeyDown={onMenuKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed z-50 min-w-48 rounded-xl border border-slate-200 bg-white/95 p-1 text-sm text-slate-700 shadow-lg backdrop-blur"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) =>
        item === "separator" ? (
          <div key={i} role="separator" className="my-1 h-px bg-slate-100" />
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onSelect();
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left hover:bg-slate-100 focus:bg-slate-100 focus:outline-none disabled:opacity-40 disabled:hover:bg-transparent ${
              item.danger ? "text-rose-600" : ""
            }`}
          >
            {item.swatch ? (
              <span
                className="size-3 shrink-0 rounded-sm ring-1 ring-slate-900/10"
                style={{ backgroundColor: item.swatch }}
              />
            ) : item.icon ? (
              <item.icon className="size-4 shrink-0 opacity-70" />
            ) : (
              <span className="size-4 shrink-0" />
            )}
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}
