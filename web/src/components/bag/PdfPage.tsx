"use client";

import { useEffect, useRef } from "react";
import { isOpen, type PDFDocumentProxy } from "./pdf";

// Keeps very large zoom levels from creating huge canvases.
const MAX_CANVAS_PIXELS = 4096;

export default function PdfPage({
  doc,
  pageNumber,
  width,
  aspect,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  // height / width
  aspect: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // A newer copy of the document is on its way; keep the current image.
    if (!isOpen(doc)) return;
    let cancelled = false;
    let task: { cancel: () => void } | undefined;

    doc
      .getPage(pageNumber)
      .then((page) => {
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;
        const base = page.getViewport({ scale: 1 });
        const pixelRatio = Math.min(
          window.devicePixelRatio || 1,
          MAX_CANVAS_PIXELS / width,
        );
        const viewport = page.getViewport({
          scale: (width / base.width) * pixelRatio,
        });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const render = page.render({ canvas, viewport });
        task = render;
        return render.promise;
      })
      .catch((error: Error) => {
        if (error?.name !== "RenderingCancelledException") console.error(error);
      });

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, pageNumber, width]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`Page ${pageNumber}`}
      className="block bg-white"
      style={{ width, height: width * aspect }}
    />
  );
}
