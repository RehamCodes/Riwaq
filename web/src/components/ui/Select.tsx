"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string };
export type SelectGroup = { label: string; options: SelectOption[] };

// A styled replacement for <select>. Options can be grouped like <optgroup>.
// ↑/↓/Home/End move, Enter/Space pick, Escape or an outside click closes.
export function Select({
  value,
  onChange,
  options,
  label,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | SelectGroup)[];
  label: string;
  className?: string;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const flat = options.flatMap((o) => ("options" in o ? o.options : [o]));
  const selected = flat.find((o) => o.value === value);
  const optionId = (i: number) => `${id}-${i}`;

  function show() {
    setActive(
      Math.max(
        0,
        flat.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
  }

  function close(refocus = true) {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }

  function pick(i: number) {
    onChange(flat[i].value);
    close();
  }

  // Place the list under the trigger, kept inside the viewport, then focus it.
  useLayoutEffect(() => {
    const list = listRef.current;
    const trigger = triggerRef.current;
    if (!open || !list || !trigger) return;
    const t = trigger.getBoundingClientRect();
    list.style.minWidth = `${t.width}px`;
    const { width, height } = list.getBoundingClientRect();
    const below = t.bottom + 4 + height <= window.innerHeight - 8;
    list.style.left = `${Math.max(8, Math.min(t.left, window.innerWidth - width - 8))}px`;
    list.style.top = `${below ? t.bottom + 4 : Math.max(8, t.top - 4 - height)}px`;
    list.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (
        !listRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      )
        setOpen(false);
    }
    function onDismiss() {
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onDismiss);
    window.addEventListener("scroll", onDismiss, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onDismiss);
      window.removeEventListener("scroll", onDismiss, true);
    };
  }, [open]);

  // Keep the highlighted option scrolled into view.
  useEffect(() => {
    if (open)
      document
        .getElementById(optionId(active))
        ?.scrollIntoView({ block: "nearest" });
  });

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      show();
    }
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    const last = flat.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(active + 1, last),
      ArrowUp: Math.max(active - 1, 0),
      Home: 0,
      End: last,
    };
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close(false);
    }
  }

  function renderOption(option: SelectOption) {
    const i = flat.indexOf(option);
    const isSelected = option.value === value;
    return (
      <div
        key={option.value}
        id={optionId(i)}
        role="option"
        aria-selected={isSelected}
        onPointerEnter={() => setActive(i)}
        onClick={() => pick(i)}
        className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 ${
          i === active ? "bg-slate-100" : ""
        }`}
      >
        <span className="flex-1 truncate">{option.label}</span>
        <Check
          className={`size-4 shrink-0 text-slate-500 ${isSelected ? "" : "invisible"}`}
        />
      </div>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => (open ? close() : show())}
        onKeyDown={onTriggerKeyDown}
        className={`flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 py-1 pr-1.5 pl-2 text-sm text-slate-700 hover:border-slate-300 focus:border-slate-400 focus:outline-none ${className}`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={optionId(active)}
          onKeyDown={onListKeyDown}
          className="fixed z-50 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white/95 p-1 text-sm text-slate-700 shadow-lg backdrop-blur focus:outline-none"
        >
          {options.map((o) =>
            "options" in o ? (
              <div key={o.label} role="group" aria-label={o.label}>
                <div className="mt-1 border-t border-slate-100 px-3 pt-2 pb-1 text-xs font-medium text-slate-400">
                  {o.label}
                </div>
                {o.options.map(renderOption)}
              </div>
            ) : (
              renderOption(o)
            ),
          )}
        </div>
      )}
    </>
  );
}
