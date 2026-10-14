"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Download, X } from "lucide-react";
import { blobUrl } from "@/lib/blob-url";
import { isOpen, openPdf, type PDFDocumentProxy } from "@/components/bag/pdf";
import PdfPage from "@/components/bag/PdfPage";
import type { FileItem } from "@/components/space/types";
import { formatCountdown } from "./access";

// Shows a file inside the page, so students can read it without getting a
// copy. Blocking downloads in the browser only discourages copying; real
// protection needs the server to stop serving the file when access ends.
export default function ExamViewer({
  file,
  endsAt,
  now,
  canDownload,
  onClose,
}: {
  file: FileItem;
  // When access ends; null for no limit.
  endsAt: number | null;
  now: number;
  canDownload: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const left = endsAt === null ? null : endsAt - now;

  function download() {
    const a = document.createElement("a");
    a.href = blobUrl(file.blob);
    a.download = file.name;
    a.click();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={file.name}
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 select-none"
      onContextMenu={(e) => !canDownload && e.preventDefault()}
    >
      <div className="flex items-center gap-3 px-4 py-3 text-white">
        <h2 className="min-w-0 flex-1 truncate font-medium">{file.name}</h2>
        {left !== null && (
          <span
            role="timer"
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm tabular-nums ${
              left < 5 * 60_000 ? "bg-rose-600" : "bg-white/15"
            }`}
          >
            <Clock className="size-4" />
            {formatCountdown(left)} left
          </span>
        )}
        {canDownload && (
          <button
            type="button"
            onClick={download}
            aria-label="Download"
            title="Download"
            className="rounded-md p-1.5 hover:bg-white/15"
          >
            <Download className="size-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          title="Close"
          className="rounded-md p-1.5 hover:bg-white/15"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 justify-center overflow-auto px-4 pb-4">
        <FileBody file={file} />
      </div>
    </div>
  );
}

function FileBody({ file }: { file: FileItem }) {
  const { mime } = file;
  if (mime === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))
    return <PdfBody file={file} />;
  if (mime.startsWith("image/"))
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local blob URL
      <img
        src={blobUrl(file.blob)}
        alt={file.name}
        draggable={false}
        className="m-auto max-h-full max-w-full object-contain"
      />
    );
  if (mime.startsWith("video/"))
    return (
      <video
        src={blobUrl(file.blob)}
        controls
        controlsList="nodownload"
        className="m-auto max-h-full max-w-full"
      />
    );
  if (mime.startsWith("audio/"))
    return (
      <audio
        src={blobUrl(file.blob)}
        controls
        controlsList="nodownload"
        className="m-auto"
      />
    );
  if (mime.startsWith("text/")) return <TextBody file={file} />;
  return (
    <p className="m-auto max-w-sm text-center text-sm text-slate-300">
      This type of file can&apos;t be shown here. Upload it as a PDF so students
      can view it.
    </p>
  );
}

function TextBody({ file }: { file: FileItem }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    file.blob.text().then((t) => !cancelled && setText(t));
    return () => {
      cancelled = true;
    };
  }, [file]);
  return (
    <pre className="h-fit w-full max-w-3xl rounded-lg bg-white p-6 text-sm whitespace-pre-wrap text-slate-800">
      {text ?? ""}
    </pre>
  );
}

function PdfBody({ file }: { file: FileItem }) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [aspects, setAspects] = useState<number[]>([]);
  const [error, setError] = useState(false);
  const [width, setWidth] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let loaded: PDFDocumentProxy | undefined;
    openPdf({ blob: file.blob })
      .then(async (pdf) => {
        if (cancelled) return pdf.loadingTask.destroy();
        loaded = pdf;
        const shapes = [];
        for (let n = 1; n <= pdf.numPages; n++) {
          const { width, height } = (await pdf.getPage(n)).getViewport({
            scale: 1,
          });
          shapes.push(height / width);
        }
        if (cancelled) return;
        setAspects(shapes);
        setDoc(pdf);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
      loaded?.loadingTask.destroy();
    };
  }, [file]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.min(900, entry.contentRect.width)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={areaRef} className="flex w-full flex-col items-center gap-3">
      {error ? (
        <p className="m-auto text-sm text-slate-300">
          This file couldn&apos;t be opened as a PDF.
        </p>
      ) : isOpen(doc) && width ? (
        aspects.map((aspect, i) => (
          <PdfPage
            key={i}
            doc={doc}
            pageNumber={i + 1}
            width={width}
            aspect={aspect}
          />
        ))
      ) : (
        <div className="aspect-[3/4] w-64 animate-pulse rounded bg-white/20" />
      )}
    </div>
  );
}
