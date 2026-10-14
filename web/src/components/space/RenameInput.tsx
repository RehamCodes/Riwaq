"use client";

import { useState } from "react";

// Inline name editor. Selects the name without its extension, like Finder.
export default function RenameInput({
  name,
  onCommit,
  onCancel,
  className = "",
}: {
  name: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [value, setValue] = useState(name);

  return (
    <input
      autoFocus
      value={value}
      aria-label="Name"
      onChange={(e) => setValue(e.target.value)}
      onFocus={(e) => {
        const dot = name.lastIndexOf(".");
        e.currentTarget.setSelectionRange(0, dot > 0 ? dot : name.length);
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") onCommit(value);
        if (e.key === "Escape") onCancel();
      }}
      onBlur={() => onCommit(value)}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className={`rounded border border-brand-light bg-white px-1 text-xs text-slate-800 outline-none ring-2 ring-brand-soft ${className}`}
    />
  );
}
