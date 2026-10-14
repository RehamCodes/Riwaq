"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  BookOpen,
  Bookmark,
  NotebookPen,
  CloudCheck,
  Save,
  ChevronLeft,
  ChevronRight,
  Maximize,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ContextMenu } from "@/components/ui";
import { isOpen, openPdf, type BookSource, type PDFDocumentProxy } from "./pdf";
import {
  loadAnnotations,
  loadNotebook,
  saveAnnotations,
  saveNotebook,
} from "./annotations-store";
import Notebook from "./Notebook";
import { ResizeHandle } from "@/components/ui";
import PdfPage from "./PdfPage";
import AnnotationLayer from "./AnnotationLayer";
import ToolPalette, { toolShortcuts } from "./ToolPalette";
import {
  inkColors,
  stickerColors,
  sizeFor,
  type Annotation,
  type PageAnnotations,
  type SizeOption,
  type Tool,
} from "./types";

export type OpenBook = {
  id: string;
  name: string;
  source: BookSource;
  // Page to scroll to when the book opens.
  initialPage: number;
};

const ZOOM = { min: 0.5, max: 3, step: 0.25 };
// Continuous-scroll layout, in px.
const LAYOUT = { padX: 32, padTop: 24, padBottom: 104, gap: 24, maxWidth: 900 };
// Pages within this many screen-heights of the view are rendered; the rest
// are blank placeholders, so long books stay fast.
const RENDER_MARGIN = 1;
const HISTORY_LIMIT = 100;
// Changes are also saved automatically this long after the last edit.
const AUTOSAVE_MS = 2000;
// Height of the notebook under the book, in px.
const NOTEBOOK_HEIGHT = { default: 300, min: 140 };
// The book always keeps at least this much height above the notebook.
const MIN_BOOK_HEIGHT = 160;

type History = {
  bookId: string | null;
  past: PageAnnotations[];
  present: PageAnnotations;
  future: PageAnnotations[];
};

type HistoryAction =
  | { type: "load"; bookId: string; annotations: PageAnnotations }
  | {
      type: "change";
      page: number;
      change: (list: Annotation[]) => Annotation[];
    }
  | { type: "undo" }
  | { type: "redo" };

function historyReducer(state: History, action: HistoryAction): History {
  switch (action.type) {
    case "load":
      return {
        bookId: action.bookId,
        past: [],
        present: action.annotations,
        future: [],
      };
    case "change": {
      const list = state.present[action.page] ?? [];
      const next = action.change(list);
      if (next === list) return state;
      return {
        ...state,
        past: [...state.past.slice(-HISTORY_LIMIT + 1), state.present],
        present: { ...state.present, [action.page]: next },
        future: [],
      };
    }
    case "undo": {
      if (!state.past.length) return state;
      return {
        ...state,
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
      };
    }
    case "redo": {
      if (!state.future.length) return state;
      return {
        ...state,
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
      };
    }
  }
}

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

// Reader for one book; give it a `key` of the book id so switching books
// starts fresh.
export default function BookCanvas({
  book,
  onPageChange,
  headerStart,
}: {
  book: OpenBook;
  onPageChange: (page: number) => void;
  headerStart?: React.ReactNode;
}) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  // height / width of every page
  const [aspects, setAspects] = useState<number[]>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [tool, setTool] = useState<Tool>("pen");
  const [inkColor, setInkColor] = useState(inkColors[0].value);
  const [stickerColor, setStickerColor] = useState(stickerColors[0].value);
  const color = tool === "sticker" ? stickerColor : inkColor;
  const setColor = tool === "sticker" ? setStickerColor : setInkColor;
  const [stickerMenu, setStickerMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [size, setSize] = useState<SizeOption>("m");
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [notebookHeight, setNotebookHeight] = useState(NOTEBOOK_HEIGHT.default);
  const [notebook, setNotebook] = useState("");
  const [saved, setSaved] = useState<{
    present: PageAnnotations | null;
    notebook: string;
    failed: boolean;
  }>({ present: null, notebook: "", failed: false });
  const [history, dispatch] = useReducer(historyReducer, {
    bookId: null,
    past: [],
    present: {},
    future: [],
  });

  const areaRef = useRef<HTMLDivElement>(null);
  const restorePage = useRef<number | null>(book.initialPage);
  // Drawings are loaded once; when the page is shown again after navigating
  // away, only the PDF is reopened so scroll, drawings and undo survive.
  const annotationsLoaded = useRef(false);
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});

  const numPages = doc?.numPages ?? 0;

  // Load the book and its saved drawings.
  useEffect(() => {
    let cancelled = false;
    let loaded: PDFDocumentProxy | undefined;
    openPdf(book.source)
      .then((pdf) => {
        if (cancelled) return pdf.loadingTask.destroy();
        loaded = pdf;
        setDoc(pdf);
        if (!annotationsLoaded.current) {
          annotationsLoaded.current = true;
          const annotations = loadAnnotations(book.id);
          dispatch({ type: "load", bookId: book.id, annotations });
          const notes = loadNotebook(book.id);
          setNotebook(notes);
          setSaved({ present: annotations, notebook: notes, failed: false });
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("This file couldn't be opened as a PDF.");
      });
    return () => {
      cancelled = true;
      loaded?.loadingTask.destroy();
    };
  }, [book]);

  // Shape of every page, so the whole book can be laid out for scrolling.
  useEffect(() => {
    if (!isOpen(doc)) return;
    let cancelled = false;
    Promise.all(
      Array.from({ length: doc.numPages }, (_, i) =>
        doc.getPage(i + 1).then((p) => {
          const { width, height } = p.getViewport({ scale: 1 });
          return height / width;
        }),
      ),
    ).then((list) => {
      if (!cancelled) setAspects(list);
    });
    return () => {
      cancelled = true;
    };
  }, [doc]);

  // ----- Saving -----
  // `saved.present` is the last version written to storage; anything newer
  // is unsaved.
  // The notebook is saved together with the drawings.
  const dirty =
    history.bookId !== null &&
    (history.present !== saved.present || notebook !== saved.notebook);

  function writeAll(bookId: string, present: PageAnnotations, notes: string) {
    const ok = saveAnnotations(bookId, present);
    return saveNotebook(bookId, notes) && ok;
  }

  function save() {
    if (!history.bookId) return;
    const ok = writeAll(history.bookId, history.present, notebook);
    setSaved((s) =>
      ok
        ? { present: history.present, notebook, failed: false }
        : { ...s, failed: true },
    );
  }

  const latest = useRef({
    save,
    bookId: history.bookId,
    present: history.present,
    notebook,
    dirty,
  });
  useEffect(() => {
    latest.current = {
      save,
      bookId: history.bookId,
      present: history.present,
      notebook,
      dirty,
    };
  });

  // Autosave shortly after the last change.
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => latest.current.save(), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [dirty, history.present, notebook]);

  // Never lose work: save when the tab is hidden or closed, or the book is
  // switched.
  useEffect(() => {
    const flush = () => {
      const { bookId, present, notebook, dirty } = latest.current;
      if (bookId && dirty) writeAll(bookId, present, notebook);
    };
    const onVisibility = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, []);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setArea({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Zoom 100% = pages fit the width of the view (up to a comfortable size).
  const fitWidth = Math.max(
    200,
    Math.min(area.width - LAYOUT.padX * 2, LAYOUT.maxWidth),
  );
  const pageWidth = Math.round(fitWidth * zoom);
  const contentWidth = Math.max(area.width, pageWidth + LAYOUT.padX * 2);

  const { tops, heights, totalHeight } = useMemo(() => {
    const heights = aspects.map((a) => Math.round(pageWidth * a));
    const tops: number[] = [];
    let y = LAYOUT.padTop;
    for (const h of heights) {
      tops.push(y);
      y += h + LAYOUT.gap;
    }
    return { tops, heights, totalHeight: y - LAYOUT.gap + LAYOUT.padBottom };
  }, [aspects, pageWidth]);

  // The current page is the one crossing the upper third of the view.
  const focusLine = scrollTop + area.height / 3;
  let pageIndex = 0;
  while (pageIndex < tops.length - 1 && tops[pageIndex + 1] <= focusLine) {
    pageIndex++;
  }
  const page = pageIndex + 1;
  const pageAnnotations = history.present[page] ?? [];

  const renderFrom = scrollTop - area.height * RENDER_MARGIN;
  const renderTo = scrollTop + area.height * (1 + RENDER_MARGIN);

  // Keep the same spot of the same page in view when zooming.
  const zoomAnchor = useRef<{ index: number; fraction: number } | null>(null);
  useLayoutEffect(() => {
    const anchor = zoomAnchor.current;
    const el = areaRef.current;
    if (!anchor || !el || !tops.length) return;
    zoomAnchor.current = null;
    el.scrollTop =
      tops[anchor.index] +
      anchor.fraction * heights[anchor.index] -
      area.height / 3;
  }, [tops, heights, area.height]);

  // Hidden pages can lose their scroll position (see isOpen in ./pdf), so
  // remember it when leaving and put it back on return.
  const hiddenScrollTop = useRef(0);
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (el && hiddenScrollTop.current) el.scrollTop = hiddenScrollTop.current;
    return () => {
      hiddenScrollTop.current = el?.scrollTop ?? 0;
    };
  }, []);

  // Reopen at the page the reader left off.
  useLayoutEffect(() => {
    const target = restorePage.current;
    const el = areaRef.current;
    if (target === null || !el || !tops.length || !area.height) return;
    restorePage.current = null;
    const index = Math.min(tops.length - 1, Math.max(0, target - 1));
    el.scrollTop = tops[index] - LAYOUT.padTop;
  }, [tops, area.height]);

  useEffect(() => {
    if (restorePage.current === null && tops.length) onPageChange(page);
  }, [page, tops.length, onPageChange]);

  const closeStickerMenu = useCallback(() => setStickerMenu(null), []);

  // All reading stickers in the book, in reading order.
  const stickers = Object.entries(history.present)
    .flatMap(([pageNumber, list]) =>
      list
        .filter((a) => a.kind === "sticker")
        .map((a) => ({ page: Number(pageNumber), annotation: a })),
    )
    .sort(
      (a, b) =>
        a.page - b.page ||
        (a.annotation.kind === "sticker" && b.annotation.kind === "sticker"
          ? a.annotation.at[1] - b.annotation.at[1]
          : 0),
    );

  function jumpToSticker(pageNumber: number, y: number) {
    const index = pageNumber - 1;
    if (!tops[index]) return;
    areaRef.current?.scrollTo({
      top: tops[index] + y * pageWidth - area.height / 3,
      behavior: "smooth",
    });
  }

  function goTo(n: number) {
    if (!tops.length) return;
    const index = Math.min(tops.length - 1, Math.max(0, n - 1));
    areaRef.current?.scrollTo({ top: tops[index] - LAYOUT.padTop });
  }

  function changeZoom(next: number) {
    const clamped = Math.min(ZOOM.max, Math.max(ZOOM.min, next));
    if (clamped === zoom) return;
    if (tops.length) {
      zoomAnchor.current = {
        index: pageIndex,
        fraction: (focusLine - tops[pageIndex]) / heights[pageIndex],
      };
    }
    setZoom(clamped);
  }

  function changePage(
    pageNumber: number,
    change: (list: Annotation[]) => Annotation[],
  ) {
    dispatch({ type: "change", page: pageNumber, change });
  }

  useEffect(() => {
    keyHandler.current = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        // Finish any text being typed first, then save it too.
        (document.activeElement as HTMLElement | null)?.blur();
        setTimeout(() => latest.current.save());
        return;
      }
      if (isTyping(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "redo" : "undo" });
      } else if (mod && key === "y") {
        e.preventDefault();
        dispatch({ type: "redo" });
      } else if (mod) {
        return;
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(page + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(page - 1);
      } else if (e.key === "+" || e.key === "=") {
        changeZoom(zoom + ZOOM.step);
      } else if (e.key === "-") {
        changeZoom(zoom - ZOOM.step);
      } else if (e.key === "0") {
        changeZoom(1);
      } else if (toolShortcuts[key]) {
        setTool(toolShortcuts[key]);
      }
    };
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const iconButton =
    "rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 px-4 py-2.5">
        {headerStart}
        <h1 className="flex min-w-0 flex-1 basis-0 items-center gap-2 text-sm font-semibold text-slate-800">
          <BookOpen className="size-5 shrink-0 text-brand" />
          <span className="truncate">{book.name}</span>
        </h1>

        <button
          type="button"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setStickerMenu({ x: r.left, y: r.bottom + 4 });
          }}
          aria-label={`Reading stickers (${stickers.length})`}
          aria-haspopup="menu"
          title="Jump to a reading sticker"
          className="relative rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <Bookmark className="size-5" />
          {stickers.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-semibold text-slate-900">
              {stickers.length > 9 ? "9+" : stickers.length}
            </span>
          )}
        </button>
        {stickerMenu && (
          <ContextMenu
            x={stickerMenu.x}
            y={stickerMenu.y}
            label="Reading stickers"
            onClose={closeStickerMenu}
            items={
              stickers.length
                ? stickers.map(({ page: n, annotation: a }) => {
                    const y = a.kind === "sticker" ? a.at[1] : 0;
                    const third = y / (aspects[n - 1] ?? 1);
                    const where =
                      third < 1 / 3
                        ? "top"
                        : third < 2 / 3
                          ? "middle"
                          : "bottom";
                    return {
                      label: `Page ${n} · ${where}`,
                      swatch: a.color,
                      onSelect: () => jumpToSticker(n, y),
                    };
                  })
                : [
                    {
                      label: "No stickers yet — use the Sticker tool (S)",
                      disabled: true,
                      onSelect: () => {},
                    },
                  ]
            }
          />
        )}

        <button
          type="button"
          onClick={() => setNotebookOpen((open) => !open)}
          aria-pressed={notebookOpen}
          title="Notebook under the book"
          className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
            notebookOpen
              ? "bg-brand-soft font-medium text-brand"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          }`}
        >
          <NotebookPen className="size-5" />
          <span className="hidden lg:inline">Notebook</span>
        </button>

        <div className="flex items-center gap-2">
          <span
            role="status"
            className={`flex items-center gap-1.5 text-xs ${
              saved.failed
                ? "text-rose-600"
                : dirty
                  ? "text-amber-600"
                  : "text-slate-400"
            }`}
          >
            {saved.failed ? (
              <span className="size-2 rounded-full bg-rose-500" />
            ) : dirty ? (
              <span className="size-2 rounded-full bg-amber-500" />
            ) : (
              <CloudCheck className="size-4" />
            )}
            <span className="hidden sm:inline">
              {saved.failed
                ? "Couldn't save"
                : dirty
                  ? "Unsaved changes"
                  : "Saved"}
            </span>
          </span>
          <button
            type="button"
            onClick={save}
            disabled={!dirty && !saved.failed}
            title="Save notes (Ctrl+S)"
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover disabled:bg-slate-100 disabled:text-slate-400"
          >
            <Save className="size-4" />
            Save
          </button>
        </div>

        <div className="flex items-center gap-1 text-sm text-slate-600">
          <button
            type="button"
            aria-label="Previous page"
            title="Previous page (←)"
            disabled={page <= 1}
            onClick={() => goTo(page - 1)}
            className={iconButton}
          >
            <ChevronLeft className="size-5" />
          </button>
          <input
            type="number"
            min={1}
            max={numPages || 1}
            value={page}
            onChange={(e) => goTo(Number(e.target.value))}
            aria-label="Page number"
            className="w-12 rounded-md border border-slate-200 px-1.5 py-0.5 text-center text-sm [appearance:textfield] focus:border-slate-400 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-slate-400">/ {numPages || "–"}</span>
          <button
            type="button"
            aria-label="Next page"
            title="Next page (→)"
            disabled={page >= numPages}
            onClick={() => goTo(page + 1)}
            className={iconButton}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="flex items-center gap-0.5 text-sm text-slate-600">
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out (−)"
            disabled={zoom <= ZOOM.min}
            onClick={() => changeZoom(zoom - ZOOM.step)}
            className={iconButton}
          >
            <ZoomOut className="size-4" />
          </button>
          <span className="w-11 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in (+)"
            disabled={zoom >= ZOOM.max}
            onClick={() => changeZoom(zoom + ZOOM.step)}
            className={iconButton}
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Fit width"
            title="Fit width (0)"
            onClick={() => changeZoom(1)}
            className={iconButton}
          >
            <Maximize className="size-4" />
          </button>
        </div>
      </div>

      {/* Book: all pages in one scrolling column */}
      <div className="relative min-h-0 flex-1 bg-slate-100">
        <div
          ref={areaRef}
          data-scroll-area
          className="absolute inset-0 overflow-auto"
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        >
          {error ? (
            <p className="flex h-full items-center justify-center text-sm text-rose-600">
              {error}
            </p>
          ) : !doc || !area.width || !aspects.length ? (
            <div className="flex h-full items-center justify-center">
              <div className="aspect-[3/4] w-64 animate-pulse rounded bg-white/70" />
            </div>
          ) : (
            <div
              className="relative"
              style={{ width: contentWidth, height: totalHeight }}
            >
              {tops.map((top, i) => {
                const height = heights[i];
                const pageNumber = i + 1;
                const near = top + height >= renderFrom && top <= renderTo;
                return (
                  <div
                    key={pageNumber}
                    className="absolute bg-white shadow-md ring-1 ring-slate-900/5"
                    style={{
                      top,
                      left: (contentWidth - pageWidth) / 2,
                      width: pageWidth,
                      height,
                    }}
                  >
                    {near && (
                      <>
                        <PdfPage
                          doc={doc}
                          pageNumber={pageNumber}
                          width={pageWidth}
                          aspect={aspects[i]}
                        />
                        <AnnotationLayer
                          annotations={history.present[pageNumber] ?? []}
                          aspect={aspects[i]}
                          pageWidth={pageWidth}
                          tool={tool}
                          color={color}
                          size={sizeFor(tool, size)}
                          onAdd={(a) =>
                            changePage(pageNumber, (list) => [...list, a])
                          }
                          onRemove={(id) =>
                            changePage(pageNumber, (list) =>
                              list.some((a) => a.id === id)
                                ? list.filter((a) => a.id !== id)
                                : list,
                            )
                          }
                          onUpdate={(a) =>
                            changePage(pageNumber, (list) =>
                              list.map((x) => (x.id === a.id ? a : x)),
                            )
                          }
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tools, floating at the bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3">
          <div className="pointer-events-auto max-w-full">
            <ToolPalette
              tool={tool}
              color={color}
              size={size}
              canUndo={history.past.length > 0}
              canRedo={history.future.length > 0}
              canClear={pageAnnotations.length > 0}
              onTool={setTool}
              onColor={setColor}
              onSize={setSize}
              onUndo={() => dispatch({ type: "undo" })}
              onRedo={() => dispatch({ type: "redo" })}
              onClear={() => changePage(page, () => [])}
            />
          </div>
        </div>
      </div>

      {/* Notebook under the book */}
      {notebookOpen && (
        <div
          className="relative shrink-0 border-t border-slate-200"
          style={{ height: notebookHeight }}
        >
          <ResizeHandle
            edge="top"
            label="Resize notebook"
            value={notebookHeight}
            min={NOTEBOOK_HEIGHT.min}
            max={Math.max(
              NOTEBOOK_HEIGHT.min,
              area.height + notebookHeight - MIN_BOOK_HEIGHT,
            )}
            defaultValue={NOTEBOOK_HEIGHT.default}
            onChange={setNotebookHeight}
          />
          <Notebook
            initialHtml={notebook}
            currentPage={page}
            onChange={setNotebook}
            onJumpToPage={goTo}
            onClose={() => setNotebookOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
