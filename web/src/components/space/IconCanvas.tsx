"use client";

import { useEffect, useRef, useState } from "react";
import { FolderOpen } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ItemIcon } from "./icons";
import RenameInput from "./RenameInput";
import { CELL, fileKind, type SpaceItem } from "./types";

const DRAG_THRESHOLD = 4;

type DragState = {
  id: string;
  x: number;
  y: number;
  // Folder under the pointer: an id, "root", or undefined for none.
  target: string | undefined;
};

// Finds a drop target (folder icon, sidebar folder, path bar segment) under
// the pointer, ignoring the item being dragged.
function dropTargetAt(clientX: number, clientY: number, draggedId: string) {
  for (const el of document.elementsFromPoint(clientX, clientY)) {
    const target = el.closest<HTMLElement>("[data-drop-folder]");
    if (target && !target.closest(`[data-item-id="${draggedId}"]`)) {
      return target.dataset.dropFolder;
    }
  }
  return undefined;
}

export default function IconCanvas({
  items,
  currentFolderId,
  selectedId,
  renamingId,
  iconSize,
  scrollRef,
  onSelect,
  onOpen,
  onMove,
  onMoveInto,
  onRename,
  onRenameCancel,
  onContextMenu,
}: {
  items: SpaceItem[];
  currentFolderId: string | null;
  selectedId: string | null;
  renamingId: string | null;
  iconSize: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (id: string | null) => void;
  onOpen: (item: SpaceItem) => void;
  onMove: (id: string, x: number, y: number) => void;
  onMoveInto: (id: string, folderId: string | null) => void;
  onRename: (id: string, name: string) => void;
  onRenameCancel: () => void;
  onContextMenu: (e: React.MouseEvent, item: SpaceItem | null) => void;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const start = useRef<{
    id: string;
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);

  const cellWidth = iconSize + 48;

  // Phones are too narrow for desktop positions: lay icons out in a grid
  // (keeping their top-to-bottom, left-to-right order) and turn off dragging.
  // Saved positions are left untouched.
  const compact = useMediaQuery("(max-width: 767px)");
  const [compactWidth, setCompactWidth] = useState(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setCompactWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollRef]);
  const placed = compact
    ? [...items]
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .map((item, i) => {
          const cols = Math.max(1, Math.floor((compactWidth - 16) / cellWidth));
          return {
            ...item,
            x: 8 + (i % cols) * cellWidth,
            y: 16 + Math.floor(i / cols) * (iconSize + 64),
          };
        })
    : items;

  const contentWidth =
    Math.max(0, ...placed.map((i) => i.x)) + cellWidth + CELL.pad;
  const contentHeight =
    Math.max(0, ...placed.map((i) => i.y)) + iconSize + 72 + CELL.pad;

  function onPointerDown(e: React.PointerEvent, item: SpaceItem) {
    if (e.button !== 0 || renamingId === item.id) return;
    onSelect(item.id);
    if (compact) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = {
      id: item.id,
      pointerX: e.clientX,
      pointerY: e.clientY,
      x: item.x,
      y: item.y,
      moved: false,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.pointerX;
    const dy = e.clientY - s.pointerY;
    if (!s.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    s.moved = true;
    setDrag({
      id: s.id,
      x: Math.max(0, s.x + dx),
      y: Math.max(0, s.y + dy),
      target: dropTargetAt(e.clientX, e.clientY, s.id),
    });
  }

  function onPointerUp() {
    const s = start.current;
    start.current = null;
    if (s?.moved && drag) {
      const folderId =
        drag.target === undefined
          ? undefined
          : drag.target === "root"
            ? null
            : drag.target;
      if (folderId !== undefined && folderId !== currentFolderId) {
        onMoveInto(drag.id, folderId);
      } else {
        onMove(drag.id, drag.x, drag.y);
      }
    }
    setDrag(null);
  }

  return (
    <div
      ref={scrollRef}
      data-canvas
      className="relative flex-1 overflow-auto"
      onPointerDown={(e) => {
        if (!(e.target as Element).closest("[data-item-id]")) onSelect(null);
      }}
      onContextMenu={(e) => {
        if ((e.target as Element).closest("[data-item-id]")) return;
        e.preventDefault();
        onSelect(null);
        onContextMenu(e, null);
      }}
    >
      <div
        className="relative"
        style={{
          width: contentWidth,
          height: contentHeight,
          minWidth: "100%",
          minHeight: "100%",
        }}
      >
        {placed.map((item) => {
          const dragging = drag?.id === item.id;
          const x = dragging ? drag.x : item.x;
          const y = dragging ? drag.y : item.y;
          const selected = selectedId === item.id;
          const isTarget =
            drag && drag.id !== item.id && drag.target === item.id;
          const kind = item.kind === "folder" ? "Folder" : fileKind(item).label;

          return (
            <div
              key={item.id}
              data-item-id={item.id}
              data-drop-folder={item.kind === "folder" ? item.id : undefined}
              className={`absolute flex touch-none flex-col items-center gap-1 select-none ${
                dragging ? "z-20 opacity-80" : "z-10"
              }`}
              style={{ left: x, top: y, width: cellWidth }}
              onPointerDown={(e) => onPointerDown(e, item)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onDoubleClick={() => onOpen(item)}
              onContextMenu={(e) => {
                e.preventDefault();
                onSelect(item.id);
                onContextMenu(e, item);
              }}
            >
              <button
                type="button"
                aria-label={`${item.name}, ${kind}`}
                aria-pressed={selected}
                onFocus={() => onSelect(item.id)}
                className={`rounded-lg p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 ${
                  isTarget
                    ? "bg-sky-200/70 ring-2 ring-sky-400"
                    : selected
                      ? "bg-slate-900/10"
                      : ""
                }`}
              >
                <ItemIcon item={item} size={iconSize} />
              </button>
              {renamingId === item.id ? (
                <RenameInput
                  name={item.name}
                  onCommit={(name) => onRename(item.id, name)}
                  onCancel={onRenameCancel}
                  className="w-full text-center"
                />
              ) : (
                <span
                  className={`line-clamp-2 max-w-full rounded px-1.5 text-center text-xs leading-snug break-words ${
                    selected ? "bg-[#3f5068] text-white" : "text-slate-700"
                  }`}
                >
                  {item.name}
                </span>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
            <FolderOpen className="size-10" strokeWidth={1.25} />
            <p className="text-sm">This folder is empty</p>
            <p className="text-xs">Drop files here or use Upload</p>
          </div>
        )}
      </div>
    </div>
  );
}
