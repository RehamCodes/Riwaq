export type FolderColor =
  "blue" | "red" | "orange" | "yellow" | "green" | "purple" | "pink" | "gray";

// Hex values are used to paint the folder SVG; `swatch` is for the picker.
export const folderColors: Record<
  FolderColor,
  { label: string; back: string; front: string; swatch: string }
> = {
  blue: {
    label: "Blue",
    back: "#3d8fe0",
    front: "#6cb2f4",
    swatch: "bg-[#6cb2f4]",
  },
  red: {
    label: "Red",
    back: "#d9454a",
    front: "#f07276",
    swatch: "bg-[#f07276]",
  },
  orange: {
    label: "Orange",
    back: "#e47f22",
    front: "#f6a95c",
    swatch: "bg-[#f6a95c]",
  },
  yellow: {
    label: "Yellow",
    back: "#dcab17",
    front: "#f3cf55",
    swatch: "bg-[#f3cf55]",
  },
  green: {
    label: "Green",
    back: "#33a052",
    front: "#66c482",
    swatch: "bg-[#66c482]",
  },
  purple: {
    label: "Purple",
    back: "#8250d2",
    front: "#a983ea",
    swatch: "bg-[#a983ea]",
  },
  pink: {
    label: "Pink",
    back: "#d64d93",
    front: "#ee81b7",
    swatch: "bg-[#ee81b7]",
  },
  gray: {
    label: "Gray",
    back: "#7f8a99",
    front: "#a9b2be",
    swatch: "bg-[#a9b2be]",
  },
};

export const folderEmojis = [
  "📚",
  "✏️",
  "🧮",
  "🧪",
  "🌍",
  "🎨",
  "💻",
  "🎵",
  "📝",
  "⭐",
  "🏆",
  "📷",
];

type BaseItem = {
  id: string;
  name: string;
  // null = the top level of the Space.
  parentId: string | null;
  // Position inside the parent folder's icon view.
  x: number;
  y: number;
  updatedAt: number;
};

export type FolderItem = BaseItem & {
  kind: "folder";
  color: FolderColor;
  emoji: string | null;
};

export type FileItem = BaseItem & {
  kind: "file";
  size: number;
  mime: string;
  blob: Blob;
};

export type SpaceItem = FolderItem | FileItem;

// Size of one slot in the icon grid used to place new items.
export const CELL = { w: 112, h: 120, pad: 24 };

export const MAX_FILE_BYTES = 100 * 1024 * 1024;

export function nextFreeSpot(siblings: SpaceItem[], columns: number) {
  const cols = Math.max(1, columns);
  for (let i = 0; ; i++) {
    const x = CELL.pad + (i % cols) * CELL.w;
    const y = CELL.pad + Math.floor(i / cols) * CELL.h;
    const taken = siblings.some(
      (s) =>
        Math.abs(s.x - x) < CELL.w * 0.6 && Math.abs(s.y - y) < CELL.h * 0.6,
    );
    if (!taken) return { x, y };
  }
}

// "Notes.pdf" → "Notes 2.pdf" when the name is already used, like Finder.
export function uniqueName(name: string, siblings: SpaceItem[]) {
  const taken = new Set(siblings.map((s) => s.name.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  const dot = name.lastIndexOf(".");
  const [base, ext] =
    dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""];
  for (let n = 2; ; n++) {
    const candidate = `${base} ${n}${ext}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export function extensionOf(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toUpperCase() : "";
}

// Label and badge color for a file type.
export function fileKind(file: FileItem): { label: string; color: string } {
  const ext = extensionOf(file.name);
  if (file.mime.startsWith("image/"))
    return { label: "Image", color: "#8b5cf6" };
  if (file.mime.startsWith("video/"))
    return { label: "Video", color: "#0ea5e9" };
  if (file.mime.startsWith("audio/"))
    return { label: "Audio", color: "#ec4899" };
  if (ext === "PDF") return { label: "PDF document", color: "#e5484d" };
  if (["DOC", "DOCX", "ODT", "RTF"].includes(ext))
    return { label: "Word document", color: "#2b6fd6" };
  if (["XLS", "XLSX", "CSV", "ODS"].includes(ext))
    return { label: "Spreadsheet", color: "#1f9d55" };
  if (["PPT", "PPTX", "KEY", "ODP"].includes(ext))
    return { label: "Presentation", color: "#e46a1f" };
  if (["ZIP", "RAR", "7Z"].includes(ext))
    return { label: "Archive", color: "#6b7280" };
  if (["TXT", "MD"].includes(ext)) return { label: "Text", color: "#475569" };
  return { label: ext ? `${ext} file` : "Document", color: "#64748b" };
}

export function descendantIds(items: SpaceItem[], folderId: string) {
  const ids: string[] = [];
  const stack = [folderId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const item of items) {
      if (item.parentId === id) {
        ids.push(item.id);
        if (item.kind === "folder") stack.push(item.id);
      }
    }
  }
  return ids;
}

export function pathTo(items: SpaceItem[], folderId: string | null) {
  const path: FolderItem[] = [];
  let id = folderId;
  while (id) {
    const folder = items.find((i) => i.id === id);
    if (!folder || folder.kind !== "folder") break;
    path.unshift(folder);
    id = folder.parentId;
  }
  return path;
}

// Starter folders for a new Space.
export function sampleFolders(now: number): FolderItem[] {
  const folders: [string, FolderColor, string | null][] = [
    ["Mathematics", "blue", "🧮"],
    ["Science", "green", "🧪"],
    ["Arabic", "orange", "📚"],
    ["Art Projects", "pink", "🎨"],
    ["Homework", "purple", "✏️"],
  ];
  return folders.map(([name, color, emoji], i) => ({
    id: crypto.randomUUID(),
    kind: "folder",
    name,
    parentId: null,
    x: CELL.pad + i * CELL.w,
    y: CELL.pad,
    color,
    emoji,
    updatedAt: now,
  }));
}
