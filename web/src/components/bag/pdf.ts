import type { PDFDocumentProxy } from "pdfjs-dist";

export type { PDFDocumentProxy };

// pdf.js only works in the browser, so it's loaded on demand. The "legacy"
// build supports older browsers (the default build needs very recent APIs,
// e.g. Map.getOrInsertComputed), which matters for school devices.
async function pdfjs() {
  const lib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!lib.GlobalWorkerOptions.workerSrc) {
    lib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
  }
  return lib;
}

// Next.js keeps a page alive but hidden when you navigate away, which runs
// effect cleanups (closing the document) while keeping component state. Check
// a stored document is still open before using it.
export function isOpen(doc: PDFDocumentProxy | null): doc is PDFDocumentProxy {
  return !!doc && !doc.loadingTask.destroyed;
}

export type BookSource = { url: string } | { blob: Blob };

export async function openPdf(source: BookSource) {
  const lib = await pdfjs();
  // pdf.js takes ownership of the bytes, so read a fresh copy each time.
  const input =
    "blob" in source
      ? { data: new Uint8Array(await source.blob.arrayBuffer()) }
      : { url: source.url };
  return lib.getDocument({ ...input, enableXfa: false }).promise;
}

// Image of the first page, for the bookshelf.
export async function renderCover(doc: PDFDocumentProxy, width = 240) {
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: width / base.width });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvas, viewport }).promise;
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
}
