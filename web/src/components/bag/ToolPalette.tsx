"use client";

import {
  Circle,
  Eraser,
  Hand,
  Highlighter,
  Minus,
  MoveUpRight,
  Pen,
  Redo2,
  Square,
  StickyNote,
  Trash2,
  Type,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { inkColors, stickerColors, type SizeOption, type Tool } from "./types";

const tools: { value: Tool; label: string; key: string; icon: LucideIcon }[] = [
  { value: "hand", label: "Hand", key: "V", icon: Hand },
  { value: "pen", label: "Pen", key: "P", icon: Pen },
  { value: "highlighter", label: "Highlighter", key: "H", icon: Highlighter },
  { value: "eraser", label: "Eraser", key: "E", icon: Eraser },
  { value: "line", label: "Line", key: "L", icon: Minus },
  { value: "arrow", label: "Arrow", key: "A", icon: MoveUpRight },
  { value: "rect", label: "Rectangle", key: "R", icon: Square },
  { value: "ellipse", label: "Ellipse", key: "O", icon: Circle },
  { value: "text", label: "Text", key: "T", icon: Type },
  { value: "sticker", label: "Reading sticker", key: "S", icon: StickyNote },
];

export const toolShortcuts = Object.fromEntries(
  tools.map((t) => [t.key.toLowerCase(), t.value]),
) as Record<string, Tool>;

const sizes: { value: SizeOption; label: string; dot: string }[] = [
  { value: "s", label: "Small", dot: "size-1.5" },
  { value: "m", label: "Medium", dot: "size-2.5" },
  { value: "l", label: "Large", dot: "size-3.5" },
];

function Divider() {
  return <span className="mx-1 h-6 w-px shrink-0 bg-slate-200" />;
}

export default function ToolPalette({
  tool,
  color,
  size,
  canUndo,
  canRedo,
  canClear,
  onTool,
  onColor,
  onSize,
  onUndo,
  onRedo,
  onClear,
}: {
  tool: Tool;
  color: string;
  size: SizeOption;
  canUndo: boolean;
  canRedo: boolean;
  canClear: boolean;
  onTool: (tool: Tool) => void;
  onColor: (color: string) => void;
  onSize: (size: SizeOption) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}) {
  const button = (active: boolean) =>
    `flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${
      active
        ? "bg-brand text-white"
        : "text-slate-600 hover:bg-slate-100 disabled:hover:bg-transparent"
    }`;
  const inkTool = tool !== "hand" && tool !== "eraser";
  const sized = inkTool && tool !== "sticker";
  const colors = tool === "sticker" ? stickerColors : inkColors;

  return (
    <div
      role="toolbar"
      aria-label="Drawing tools"
      className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-md backdrop-blur [scrollbar-width:none]"
    >
      {tools.map(({ value, label, key, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={tool === value}
          title={`${label} (${key})`}
          onClick={() => onTool(value)}
          className={button(tool === value)}
        >
          <Icon className="size-[18px]" />
        </button>
      ))}

      <Divider />
      <div role="group" aria-label="Color" className="flex items-center gap-1">
        {colors.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-label={c.label}
            aria-pressed={color === c.value}
            title={c.label}
            disabled={!inkTool}
            onClick={() => onColor(c.value)}
            className={`size-6 shrink-0 rounded-full transition-transform disabled:opacity-30 ${
              color === c.value && inkTool
                ? "ring-2 ring-slate-700 ring-offset-2"
                : "hover:scale-110"
            }`}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>

      <Divider />
      <div role="group" aria-label="Size" className="flex items-center">
        {sizes.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-label={`${s.label} size`}
            aria-pressed={size === s.value}
            title={s.label}
            disabled={!sized}
            onClick={() => onSize(s.value)}
            className={button(size === s.value && sized)}
          >
            <span className={`rounded-full bg-current ${s.dot}`} />
          </button>
        ))}
      </div>

      <Divider />
      <button
        type="button"
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
        disabled={!canUndo}
        onClick={onUndo}
        className={button(false)}
      >
        <Undo2 className="size-[18px]" />
      </button>
      <button
        type="button"
        aria-label="Redo"
        title="Redo (Ctrl+Shift+Z)"
        disabled={!canRedo}
        onClick={onRedo}
        className={button(false)}
      >
        <Redo2 className="size-[18px]" />
      </button>
      <button
        type="button"
        aria-label="Clear page"
        title="Clear this page's drawings"
        disabled={!canClear}
        onClick={onClear}
        className={button(false)}
      >
        <Trash2 className="size-[18px]" />
      </button>
    </div>
  );
}
