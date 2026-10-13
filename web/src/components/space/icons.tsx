"use client";

import { useState } from "react";
import {
  extensionOf,
  fileKind,
  folderColors,
  type FileItem,
  type FolderColor,
  type SpaceItem,
} from "./types";

// Object URLs for image thumbnails, one per blob. Released when the file is
// deleted (see releaseThumbnail).
const thumbnailUrls = new WeakMap<Blob, string>();

function thumbnailUrl(blob: Blob) {
  let url = thumbnailUrls.get(blob);
  if (!url) {
    url = URL.createObjectURL(blob);
    thumbnailUrls.set(blob, url);
  }
  return url;
}

export function releaseThumbnail(blob: Blob) {
  const url = thumbnailUrls.get(blob);
  if (url) URL.revokeObjectURL(url);
  thumbnailUrls.delete(blob);
}

export function FolderIcon({
  color,
  emoji,
  size,
}: {
  color: FolderColor;
  emoji: string | null;
  size: number;
}) {
  const { back, front } = folderColors[color];
  return (
    <span
      className="relative inline-block"
      style={{ width: size, height: size * 0.8 }}
    >
      <svg viewBox="0 0 64 52" className="size-full" aria-hidden="true">
        <path
          d="M4 6a4 4 0 0 1 4-4h14.5a4 4 0 0 1 3 1.4L28 6h28a4 4 0 0 1 4 4v34a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"
          fill={back}
        />
        <rect x="2" y="13" width="60" height="37" rx="4" fill={front} />
        <rect
          x="2"
          y="13"
          width="60"
          height="2.5"
          rx="1.25"
          fill="#fff"
          opacity="0.3"
        />
      </svg>
      {emoji && (
        <span
          className="absolute left-1/2 -translate-x-1/2 leading-none select-none"
          style={{ top: "42%", fontSize: size * 0.3 }}
          aria-hidden="true"
        >
          {emoji}
        </span>
      )}
    </span>
  );
}

export function FileIcon({ file, size }: { file: FileItem; size: number }) {
  if (file.mime.startsWith("image/")) {
    return <ImageThumbnail file={file} size={size} />;
  }
  return <DocumentIcon file={file} size={size} />;
}

function ImageThumbnail({ file, size }: { file: FileItem; size: number }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <DocumentIcon file={file} size={size} />;
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{ width: size, height: size * 0.8 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local blob URL */}
      <img
        src={thumbnailUrl(file.blob)}
        alt=""
        draggable={false}
        onError={() => setBroken(true)}
        className="max-h-full max-w-full rounded-sm border-2 border-white object-contain shadow"
      />
    </span>
  );
}

function DocumentIcon({ file, size }: { file: FileItem; size: number }) {
  const ext = extensionOf(file.name).slice(0, 4);
  const { color } = fileKind(file);
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{ width: size, height: size * 0.8 }}
    >
      <svg viewBox="0 0 48 60" style={{ height: "100%" }} aria-hidden="true">
        <path
          d="M4 1h28l13 13v43a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z"
          fill="#fff"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />
        <path
          d="M32 1v11a2 2 0 0 0 2 2h11"
          fill="#e2e8f0"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />
        {[24, 29, 34].map((y) => (
          <rect
            key={y}
            x="9"
            y={y}
            width="30"
            height="2"
            rx="1"
            fill="#e2e8f0"
          />
        ))}
        {ext && (
          <>
            <rect x="6" y="42" width="36" height="12" rx="2" fill={color} />
            <text
              x="24"
              y="51"
              textAnchor="middle"
              fontSize="8"
              fontWeight="700"
              fill="#fff"
              fontFamily="system-ui, sans-serif"
            >
              {ext}
            </text>
          </>
        )}
      </svg>
    </span>
  );
}

export function ItemIcon({ item, size }: { item: SpaceItem; size: number }) {
  return item.kind === "folder" ? (
    <FolderIcon color={item.color} emoji={item.emoji} size={size} />
  ) : (
    <FileIcon file={item} size={size} />
  );
}
