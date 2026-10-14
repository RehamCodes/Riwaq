"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Baseline,
  Bold,
  BookmarkPlus,
  Heading3,
  Italic,
  List,
  ListOrdered,
  NotebookPen,
  Underline,
  X,
  type LucideIcon,
} from "lucide-react";
import { pageChipHtml, sanitizeNotebookHtml } from "./notebook-html";

// Lined paper: a red margin line and a rule every 28px (the line height).
const LINE = 28;
const paper = {
  backgroundImage: [
    "linear-gradient(to right, transparent 39px, #fca5a5 39px, #fca5a5 40px, transparent 40px)",
    `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE - 1}px, #e2e8f0 ${LINE - 1}px, #e2e8f0 ${LINE}px)`,
  ].join(", "),
  backgroundAttachment: "local",
  lineHeight: `${LINE}px`,
};

// Text colors (all readable on white paper). The first is the normal color.
export const TEXT_COLORS = [
  { value: "#1e293b", label: "Default" },
  { value: "#dc2626", label: "Red" },
  { value: "#ea580c", label: "Orange" },
  { value: "#ca8a04", label: "Gold" },
  { value: "#16a34a", label: "Green" },
  { value: "#2563eb", label: "Blue" },
  { value: "#7c3aed", label: "Purple" },
  { value: "#db2777", label: "Pink" },
  { value: "#64748b", label: "Gray" },
];

// "rgb(220, 38, 38)" → "#dc2626"
function toHex(color: string) {
  const m = color.match(/\d+/g);
  if (!color.startsWith("rgb") || !m || m.length < 3)
    return TEXT_COLORS[0].value;
  return `#${m
    .slice(0, 3)
    .map((n) => Number(n).toString(16).padStart(2, "0"))
    .join("")}`;
}

type Format = "bold" | "italic" | "underline" | "ul" | "ol" | "h3";

const formats: {
  value: Format;
  label: string;
  key?: string;
  icon: LucideIcon;
}[] = [
  { value: "bold", label: "Bold", key: "Ctrl+B", icon: Bold },
  { value: "italic", label: "Italic", key: "Ctrl+I", icon: Italic },
  { value: "underline", label: "Underline", key: "Ctrl+U", icon: Underline },
  { value: "h3", label: "Heading", icon: Heading3 },
  { value: "ul", label: "Bulleted list", icon: List },
  { value: "ol", label: "Numbered list", icon: ListOrdered },
];

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function Notebook({
  initialHtml,
  currentPage,
  onChange,
  onJumpToPage,
  onClose,
}: {
  initialHtml: string;
  currentPage: number;
  onChange: (html: string) => void;
  onJumpToPage: (page: number) => void;
  onClose: () => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const filled = useRef(false);
  const [active, setActive] = useState<Set<Format>>(new Set());
  const [words, setWords] = useState(0);
  const [textColor, setTextColor] = useState(TEXT_COLORS[0].value);
  const [colorMenu, setColorMenu] = useState<{ x: number; y: number } | null>(
    null,
  );
  const colorMenuRef = useRef<HTMLDivElement>(null);
  // Selection to color, kept while the color menu (or the system color
  // picker) has focus.
  const savedRange = useRef<Range | null>(null);

  // Fill the editor once; after that it owns its content (so the caret never
  // jumps), including when the page is shown again after navigating away.
  useLayoutEffect(() => {
    const el = editorRef.current;
    if (!el || filled.current) return;
    filled.current = true;
    el.innerHTML = sanitizeNotebookHtml(initialHtml);
    setWords(wordCount(el.innerText));
  }, [initialHtml]);

  // Highlight the toolbar buttons that apply where the caret is.
  useEffect(() => {
    function update() {
      const el = editorRef.current;
      const node = document.getSelection()?.anchorNode;
      if (!el || !node || !el.contains(node)) return;
      const next = new Set<Format>();
      if (document.queryCommandState("bold")) next.add("bold");
      if (document.queryCommandState("italic")) next.add("italic");
      if (document.queryCommandState("underline")) next.add("underline");
      if (document.queryCommandState("insertUnorderedList")) next.add("ul");
      if (document.queryCommandState("insertOrderedList")) next.add("ol");
      const block = (
        node instanceof Element ? node : node.parentElement
      )?.closest("h3");
      if (block && el.contains(block)) next.add("h3");
      setActive(next);
      setTextColor(toHex(document.queryCommandValue("foreColor")));
    }
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, []);

  function emit() {
    const el = editorRef.current;
    if (!el) return;
    onChange(el.innerHTML);
    setWords(wordCount(el.innerText));
  }

  // Put the caret in the editor (at the end) if it isn't there already.
  function focusEditor() {
    const el = editorRef.current;
    if (!el) return;
    const selection = document.getSelection();
    if (selection?.anchorNode && el.contains(selection.anchorNode)) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  // Close the color menu on outside click or Escape.
  useEffect(() => {
    if (!colorMenu) return;
    function onPointerDown(e: PointerEvent) {
      if (!colorMenuRef.current?.contains(e.target as Node)) setColorMenu(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setColorMenu(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [colorMenu]);

  function openColorMenu(button: HTMLElement) {
    const selection = document.getSelection();
    const el = editorRef.current;
    savedRange.current =
      selection?.rangeCount && el?.contains(selection.anchorNode)
        ? selection.getRangeAt(0).cloneRange()
        : null;
    const r = button.getBoundingClientRect();
    setColorMenu({ x: r.left, y: r.bottom + 4 });
  }

  function applyColor(color: string, { close = true } = {}) {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    if (savedRange.current) {
      const selection = document.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedRange.current);
    } else {
      focusEditor();
    }
    // Plain <font color> tags (not inline styles), which the cleaner keeps.
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand("foreColor", false, color);
    setTextColor(color);
    if (close) setColorMenu(null);
    emit();
  }

  function applyFormat(format: Format) {
    focusEditor();
    // execCommand is old but still the simplest way to format a
    // contentEditable area, and every browser supports these commands.
    if (format === "h3") {
      document.execCommand(
        "formatBlock",
        false,
        active.has("h3") ? "div" : "h3",
      );
    } else if (format === "ul") {
      document.execCommand("insertUnorderedList");
    } else if (format === "ol") {
      document.execCommand("insertOrderedList");
    } else {
      document.execCommand(format);
    }
    emit();
  }

  function addPageLink() {
    focusEditor();
    document.execCommand(
      "insertHTML",
      false,
      `${pageChipHtml(currentPage)}&nbsp;`,
    );
    emit();
  }

  const toolButton = (on: boolean) =>
    `flex size-8 shrink-0 items-center justify-center rounded-md transition-colors ${
      on ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="flex h-full flex-col bg-white">
      <div
        role="toolbar"
        aria-label="Notebook formatting"
        className="flex items-center gap-0.5 overflow-x-auto border-b border-slate-200 px-3 py-1.5 [scrollbar-width:none]"
        // Keep the text selection when clicking toolbar buttons.
        onMouseDown={(e) => {
          if ((e.target as Element).closest("button")) e.preventDefault();
        }}
      >
        <h2 className="mr-2 flex shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-700">
          <NotebookPen className="size-4 text-brand" />
          Notebook
        </h2>
        {formats.map(({ value, label, key, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={active.has(value)}
            title={key ? `${label} (${key})` : label}
            onClick={() => applyFormat(value)}
            className={toolButton(active.has(value))}
          >
            <Icon className="size-4" />
          </button>
        ))}
        <button
          type="button"
          aria-label="Text color"
          aria-haspopup="menu"
          aria-expanded={!!colorMenu}
          title="Text color"
          onClick={(e) =>
            colorMenu ? setColorMenu(null) : openColorMenu(e.currentTarget)
          }
          className={`${toolButton(false)} flex-col gap-0`}
        >
          <Baseline className="size-4" />
          <span
            className="-mt-0.5 h-1 w-4 rounded-full"
            style={{ backgroundColor: textColor }}
          />
        </button>
        <span className="mx-1 h-5 w-px shrink-0 bg-slate-200" />
        <button
          type="button"
          onClick={addPageLink}
          title="Insert a link to the page you're reading"
          className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-50"
        >
          <BookmarkPlus className="size-4" />
          Link p. {currentPage}
        </button>
        <span className="ml-auto shrink-0 pl-2 text-xs text-slate-400">
          {words} word{words === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notebook"
          title="Close notebook"
          className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-4" />
        </button>
      </div>

      {colorMenu && (
        <div
          ref={colorMenuRef}
          role="menu"
          aria-label="Text color"
          className="fixed z-50 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
          style={{ left: colorMenu.x, top: colorMenu.y }}
          // Keep the text selection while picking.
          onMouseDown={(e) => {
            if ((e.target as Element).tagName !== "INPUT") e.preventDefault();
          }}
        >
          <div className="grid grid-cols-5 gap-1.5">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                role="menuitemradio"
                aria-checked={textColor === c.value}
                aria-label={c.label}
                title={c.label}
                onClick={() => applyColor(c.value)}
                className={`size-7 rounded-full transition-transform hover:scale-110 ${
                  textColor === c.value
                    ? "ring-2 ring-slate-700 ring-offset-2"
                    : "ring-1 ring-slate-900/10"
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
          <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-xs text-slate-600 hover:bg-slate-50">
            <input
              type="color"
              value={textColor}
              onChange={(e) => applyColor(e.target.value, { close: false })}
              className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            Custom color…
          </label>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto" style={paper}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Notebook"
          data-placeholder="Write your notes about this book… Use “Link p.” to point back to a page."
          onInput={emit}
          onPaste={(e) => {
            // Paste as plain text so no outside formatting or code comes in.
            e.preventDefault();
            document.execCommand(
              "insertText",
              false,
              e.clipboardData.getData("text/plain"),
            );
          }}
          onClick={(e) => {
            const chip = (e.target as Element).closest<HTMLElement>(
              "[data-page]",
            );
            if (chip?.dataset.page) onJumpToPage(Number(chip.dataset.page));
          }}
          // Plain hex default color, so the color picker can recognize it.
          style={{ color: TEXT_COLORS[0].value }}
          className="min-h-full px-5 pt-[28px] pb-14 pl-[52px] text-[15px] outline-none empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc"
        />
      </div>
    </div>
  );
}
