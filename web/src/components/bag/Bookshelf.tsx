"use client";

import { useRef, useState } from "react";
import { BookOpen, BookPlus, LibraryBig, X } from "lucide-react";
import { ResizeHandle } from "@/components/ui";
import { blobUrl } from "@/lib/blob-url";
import type { ShelfBook } from "./shelf-db";

export const SHELF_WIDTH = { default: 248, min: 200, max: 420 };

function Cover({ book }: { book: ShelfBook }) {
  if (!book.cover) {
    return (
      <span className="flex size-full items-center justify-center bg-slate-100 text-slate-400">
        <BookOpen className="size-8" strokeWidth={1.25} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local blob URL
    <img
      src={blobUrl(book.cover)}
      alt=""
      draggable={false}
      className="size-full object-contain"
    />
  );
}

export default function Bookshelf({
  books,
  currentId,
  importing,
  width,
  onWidthChange,
  onImport,
  onSelect,
  onRemove,
  onClose,
  className = "",
}: {
  books: ShelfBook[];
  currentId: string | null;
  // Number of books being added right now.
  importing: number;
  width?: number;
  onWidthChange?: (width: number) => void;
  onImport: (files: File[]) => void;
  onSelect: (book: ShelfBook) => void;
  onRemove: (book: ShelfBook) => void;
  onClose: () => void;
  className?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const sorted = [...books].sort((a, b) => b.addedAt - a.addedAt);

  return (
    <aside
      aria-label="Bookshelf"
      style={
        width
          ? ({ "--shelf-width": `${width}px` } as React.CSSProperties)
          : undefined
      }
      className={`@container relative flex shrink-0 flex-col border-r border-slate-200 bg-slate-50 ${
        width ? "w-(--shelf-width)" : ""
      } ${className}`}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onImport([...e.dataTransfer.files]);
      }}
    >
      {width && onWidthChange && (
        <ResizeHandle
          label="Resize bookshelf"
          value={width}
          min={SHELF_WIDTH.min}
          max={SHELF_WIDTH.max}
          defaultValue={SHELF_WIDTH.default}
          onChange={onWidthChange}
        />
      )}

      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5">
        <h2 className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-slate-800">
          <LibraryBig className="size-5 shrink-0 text-[#3f5068]" />
          <span className="truncate">Bookshelf</span>
          <span className="text-xs font-normal text-slate-400">
            {books.length}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Import books"
          title="Import books"
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#3f5068] px-2 py-1.5 text-xs font-medium text-white hover:bg-[#34445a]"
        >
          <BookPlus className="size-4" />
          {/* Label only when the shelf is wide enough. */}
          <span className="hidden @min-[240px]:inline">Import</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close bookshelf"
          className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 md:hidden"
        >
          <X className="size-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={(e) => {
            onImport([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-x-3 gap-y-5">
          {Array.from({ length: importing }, (_, i) => (
            <li key={`importing-${i}`} className="flex flex-col gap-1.5">
              <span className="aspect-[3/4] animate-pulse rounded-md bg-slate-200" />
              <span className="text-xs text-slate-400">Adding…</span>
            </li>
          ))}
          {sorted.map((book) => {
            const active = book.id === currentId;
            const progress = book.pages ? book.lastPage / book.pages : 0;
            return (
              <li key={book.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(book)}
                  aria-current={active ? "true" : undefined}
                  aria-label={`${book.name}, page ${book.lastPage} of ${book.pages}`}
                  className="flex w-full flex-col gap-1.5 text-left"
                >
                  <span
                    className={`relative block aspect-[3/4] overflow-hidden rounded-md bg-white shadow-md transition-transform group-hover:-translate-y-0.5 ${
                      active
                        ? "ring-2 ring-[#3f5068] ring-offset-2 ring-offset-slate-50"
                        : "ring-1 ring-slate-900/5"
                    }`}
                  >
                    <Cover book={book} />
                    {book.builtin && (
                      <span className="absolute bottom-1 left-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        Sample
                      </span>
                    )}
                  </span>
                  <span className="block h-1 w-full overflow-hidden rounded-full bg-slate-200">
                    <span
                      className="block h-full rounded-full bg-[#3f5068]"
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  </span>
                  <span className="line-clamp-2 text-xs leading-snug font-medium text-slate-700">
                    {book.name}
                  </span>
                  <span className="-mt-1 text-[11px] text-slate-400">
                    p. {book.lastPage} of {book.pages}
                  </span>
                </button>
                {!book.builtin && (
                  <button
                    type="button"
                    onClick={() => onRemove(book)}
                    aria-label={`Remove ${book.name}`}
                    title="Remove from shelf"
                    className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-white/90 text-slate-500 opacity-0 shadow transition-opacity group-hover:opacity-100 hover:text-rose-600 focus:opacity-100 [@media(hover:none)]:opacity-100"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-center text-[11px] text-slate-400">
          Drop PDF books here to add them
        </p>
      </div>

      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-sky-400 bg-sky-50/80">
          <p className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-sky-700 shadow">
            Drop to add to your shelf
          </p>
        </div>
      )}
    </aside>
  );
}
