"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookPlus, LibraryBig } from "lucide-react";
import { Button, Modal, ModalHeader } from "@/components/ui";
import { useMediaQuery } from "@/hooks/use-media-query";
import { releaseBlobUrl } from "@/lib/blob-url";
import BookCanvas, { type OpenBook } from "./BookCanvas";
import Bookshelf, { SHELF_WIDTH } from "./Bookshelf";
import { deleteAnnotations, deleteNotebook } from "./annotations-store";
import { openPdf, renderCover } from "./pdf";
import {
  deleteBook,
  loadShelf,
  markSeeded,
  putBook,
  type ShelfBook,
} from "./shelf-db";

// Public-domain book bundled for testing (see public/sample-books).
const SAMPLE = {
  id: "sample:alice-in-wonderland",
  name: "Alice's Adventures in Wonderland",
  source: { url: "/sample-books/alice-in-wonderland.pdf" },
};

const MAX_BOOK_BYTES = 300 * 1024 * 1024;

// Called from effects and event handlers only (never during render).
function timestamp() {
  return Date.now();
}

function toOpenBook(book: ShelfBook): OpenBook {
  return {
    id: book.id,
    name: book.name,
    source: book.source,
    initialPage: book.lastPage,
  };
}

async function describePdf(source: ShelfBook["source"]) {
  const doc = await openPdf(source);
  try {
    const cover = await renderCover(doc).catch(() => null);
    return { pages: doc.numPages, cover };
  } finally {
    doc.loadingTask.destroy();
  }
}

async function createSample(): Promise<ShelfBook> {
  const now = timestamp();
  const { pages, cover } = await describePdf(SAMPLE.source);
  return {
    ...SAMPLE,
    pages,
    cover,
    addedAt: now,
    openedAt: now,
    lastPage: 1,
    builtin: true,
  };
}

export default function BagApp() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [books, setBooks] = useState<ShelfBook[] | null>(null);
  const [opened, setOpened] = useState<OpenBook | null>(null);
  // null = default: shown on desktop, hidden on phones.
  const [shelfOpen, setShelfOpen] = useState<boolean | null>(null);
  const [shelfWidth, setShelfWidth] = useState(SHELF_WIDTH.default);
  const [importing, setImporting] = useState(0);
  const [removing, setRemoving] = useState<ShelfBook | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const booksRef = useRef<ShelfBook[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const shelfVisible = shelfOpen ?? !isMobile;

  useEffect(() => {
    booksRef.current = books ?? [];
  }, [books]);

  // Load the shelf; the first visit gets the sample book.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let list: ShelfBook[];
      try {
        const shelf = await loadShelf();
        if (cancelled) return;
        list = shelf.books;
        if (!shelf.seeded) {
          const sample = await createSample();
          if (cancelled) return;
          list = [sample, ...list];
          await putBook(sample);
          await markSeeded();
        }
      } catch {
        if (cancelled) return;
        list = [await createSample()];
      }
      if (cancelled) return;
      setBooks(list);
      const recent = [...list].sort((a, b) => b.openedAt - a.openedAt)[0];
      // Keep the open book when the page is shown again after navigating.
      if (recent) setOpened((current) => current ?? toOpenBook(recent));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = useCallback((text: string) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  function open(book: ShelfBook) {
    const updated = { ...book, openedAt: timestamp() };
    setBooks(
      (list) => list?.map((b) => (b.id === book.id ? updated : b)) ?? null,
    );
    putBook(updated).catch(() => {});
    setOpened(toOpenBook(updated));
    if (isMobile) setShelfOpen(false);
  }

  async function importFiles(files: File[]) {
    let lastAdded: ShelfBook | null = null;
    for (const file of files) {
      const name = file.name.replace(/\.pdf$/i, "");
      if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
        showToast(
          `“${file.name}” isn't a PDF — only PDF books can be added for now`,
        );
        continue;
      }
      if (file.size > MAX_BOOK_BYTES) {
        showToast(`“${name}” is too large (max 300 MB)`);
        continue;
      }
      const existing = booksRef.current.find(
        (b) => b.name === name && b.fileSize === file.size,
      );
      if (existing) {
        showToast(`“${name}” is already on your shelf`);
        lastAdded = existing;
        continue;
      }

      setImporting((n) => n + 1);
      try {
        const source = { blob: file as Blob };
        const { pages, cover } = await describePdf(source);
        const now = timestamp();
        const book: ShelfBook = {
          id: crypto.randomUUID(),
          name,
          pages,
          cover,
          source,
          fileSize: file.size,
          addedAt: now,
          openedAt: now,
          lastPage: 1,
        };
        await putBook(book).catch(() =>
          showToast(
            "Couldn't save to this browser — the book will be gone after reload",
          ),
        );
        setBooks((list) => [book, ...(list ?? [])]);
        lastAdded = book;
      } catch {
        showToast(`“${name}” couldn't be opened as a PDF`);
      } finally {
        setImporting((n) => n - 1);
      }
    }
    if (lastAdded) open(lastAdded);
  }

  // Remember the page, saving shortly after scrolling stops.
  const openedId = opened?.id;
  const handlePageChange = useCallback(
    (page: number) => {
      if (!openedId) return;
      setBooks(
        (list) =>
          list?.map((b) =>
            b.id === openedId ? { ...b, lastPage: page } : b,
          ) ?? null,
      );
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const book = booksRef.current.find((b) => b.id === openedId);
        if (book) putBook(book).catch(() => {});
      }, 600);
    },
    [openedId],
  );

  function confirmRemove(book: ShelfBook) {
    deleteBook(book.id).catch(() => {});
    deleteAnnotations(book.id);
    deleteNotebook(book.id);
    if (book.cover) releaseBlobUrl(book.cover);
    const rest = (books ?? []).filter((b) => b.id !== book.id);
    setBooks(rest);
    setRemoving(null);
    if (opened?.id === book.id) {
      const next = [...rest].sort((a, b) => b.openedAt - a.openedAt)[0];
      setOpened(next ? toOpenBook(next) : null);
    }
    showToast(`Removed “${book.name}”`);
  }

  const closeRemove = useCallback(() => setRemoving(null), []);

  const shelfToggle = (
    <button
      type="button"
      onClick={() => setShelfOpen(!shelfVisible)}
      aria-pressed={shelfVisible}
      aria-label={shelfVisible ? "Hide bookshelf" : "Show bookshelf"}
      title="Bookshelf"
      className={`rounded-md p-1.5 transition-colors ${
        shelfVisible
          ? "bg-brand-soft text-brand"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      <LibraryBig className="size-5" />
    </button>
  );

  if (!books) {
    return (
      <div
        className="h-full animate-pulse rounded-2xl bg-white"
        aria-busy="true"
      />
    );
  }

  const shelfProps = {
    books,
    currentId: opened?.id ?? null,
    importing,
    onImport: importFiles,
    onSelect: open,
    onRemove: setRemoving,
    onClose: () => setShelfOpen(false),
  };

  return (
    <section className="relative flex h-full min-h-[480px] overflow-hidden rounded-2xl bg-white">
      {shelfVisible &&
        (isMobile ? (
          <div className="absolute inset-0 z-30 flex">
            <Bookshelf {...shelfProps} className="w-full" />
          </div>
        ) : (
          <Bookshelf
            {...shelfProps}
            width={shelfWidth}
            onWidthChange={setShelfWidth}
          />
        ))}

      {opened ? (
        <BookCanvas
          key={opened.id}
          book={opened}
          onPageChange={handlePageChange}
          headerStart={shelfToggle}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-slate-500">
          <LibraryBig className="size-12 text-slate-300" strokeWidth={1.25} />
          <p className="text-sm">Your bookshelf is empty.</p>
          <Button onClick={() => setShelfOpen(true)}>
            <BookPlus className="size-4" />
            Add a book
          </Button>
        </div>
      )}

      {removing && (
        <Modal label="Remove book" onClose={closeRemove}>
          <ModalHeader
            title={`Remove “${removing.name}”?`}
            onClose={closeRemove}
          />
          <p className="mt-3 text-slate-600">
            The book, your notebook and everything you wrote or drew in it will
            be removed from this browser. This can&apos;t be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={closeRemove}>
              Cancel
            </Button>
            <Button
              autoFocus
              variant="destructive"
              onClick={() => confirmRemove(removing)}
            >
              Remove
            </Button>
          </div>
        </Modal>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white shadow-lg md:bottom-6"
        >
          {toast}
        </div>
      )}
    </section>
  );
}
