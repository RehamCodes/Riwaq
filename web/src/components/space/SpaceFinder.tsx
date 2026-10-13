"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Ellipsis,
  ExternalLink,
  FolderOpen,
  FolderPlus,
  LayoutGrid,
  List,
  Orbit,
  Palette,
  Pencil,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  Button,
  ContextMenu,
  Modal,
  ModalHeader,
  ResizeHandle,
  type MenuEntry,
} from "@/components/ui";
import { deleteItems, loadSpace, markSeeded, saveItems } from "./space-db";
import { FolderIcon, releaseThumbnail } from "./icons";
import IconCanvas from "./IconCanvas";
import ListView from "./ListView";
import FolderStyleDialog, { type FolderStyle } from "./FolderStyleDialog";
import {
  CELL,
  MAX_FILE_BYTES,
  descendantIds,
  formatSize,
  nextFreeSpot,
  pathTo,
  sampleFolders,
  uniqueName,
  type FileItem,
  type FolderItem,
  type SpaceItem,
} from "./types";

type View = "icons" | "list";

// Sidebar width on desktop, adjustable by dragging its right border.
const SIDEBAR_WIDTH = { default: 208, min: 160, max: 360 };
type MenuState = { x: number; y: number; item: SpaceItem | null };

// Files the browser can show in a tab; anything else is downloaded.
function canPreview(mime: string) {
  return /^(image|video|audio|text)\//.test(mime) || mime === "application/pdf";
}

// Called from event handlers only (never during render).
function timestamp() {
  return Date.now();
}

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

export default function SpaceFinder() {
  const [items, setItems] = useState<SpaceItem[] | null>(null);
  const [storageOk, setStorageOk] = useState(true);
  const [history, setHistory] = useState<(string | null)[]>([null]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [view, setView] = useState<View>("icons");
  const [iconSize, setIconSize] = useState(64);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_WIDTH.default);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [styling, setStyling] = useState<FolderItem | null>(null);
  const [deleting, setDeleting] = useState<SpaceItem | null>(null);
  const [fileDragOver, setFileDragOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});

  const currentId = history[historyIndex];

  // Load the Space from browser storage; first visit gets starter folders.
  useEffect(() => {
    let cancelled = false;
    loadSpace()
      .then(async ({ items, seeded }) => {
        if (cancelled) return;
        if (!seeded && items.length === 0) {
          const starter = sampleFolders(timestamp());
          setItems(starter);
          await saveItems(starter);
          await markSeeded();
        } else {
          setItems(items);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setStorageOk(false);
        setItems(sampleFolders(timestamp()));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = useCallback((text: string) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const onStorageError = useCallback(() => {
    setStorageOk(false);
    showToast("Couldn't save — changes will be lost on reload");
  }, [showToast]);

  function commit(changed: SpaceItem[], removedIds: string[] = []) {
    setItems((list) => {
      const map = new Map((list ?? []).map((i) => [i.id, i]));
      removedIds.forEach((id) => map.delete(id));
      changed.forEach((i) => map.set(i.id, i));
      return [...map.values()];
    });
    if (changed.length) saveItems(changed).catch(onStorageError);
    if (removedIds.length) deleteItems(removedIds).catch(onStorageError);
  }

  const all = items ?? [];
  const byId = (id: string | null) => all.find((i) => i.id === id);
  const childrenOf = (id: string | null) =>
    all.filter((i) => i.parentId === id);
  const currentFolder = currentId ? (byId(currentId) as FolderItem) : null;
  const children = childrenOf(currentId);
  const visible = query.trim()
    ? children.filter((i) =>
        i.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : children;
  const selected = byId(selectedId) ?? null;
  const path = pathTo(all, currentId);
  const topFolders = childrenOf(null).filter(
    (i): i is FolderItem => i.kind === "folder",
  );
  const files = all.filter((i): i is FileItem => i.kind === "file");
  const usedBytes = files.reduce((sum, f) => sum + f.size, 0);

  function columns() {
    const width = canvasRef.current?.clientWidth ?? 600;
    return Math.floor((width - CELL.pad) / CELL.w);
  }

  // ----- Navigation -----

  function navigate(folderId: string | null) {
    if (folderId === currentId) return;
    setHistory((h) => [...h.slice(0, historyIndex + 1), folderId]);
    setHistoryIndex((i) => i + 1);
    setSelectedId(null);
    setRenamingId(null);
    setQuery("");
  }

  function goHistory(step: 1 | -1) {
    const next = historyIndex + step;
    if (next < 0 || next >= history.length) return;
    setHistoryIndex(next);
    setSelectedId(null);
    setRenamingId(null);
  }

  function open(item: SpaceItem) {
    if (item.kind === "folder") return navigate(item.id);
    if (canPreview(item.mime)) {
      const url = URL.createObjectURL(item.blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } else {
      download(item);
    }
  }

  function download(file: FileItem) {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  // ----- Changes -----

  function newFolder() {
    const siblings = childrenOf(currentId);
    const folder: FolderItem = {
      id: crypto.randomUUID(),
      kind: "folder",
      name: uniqueName("untitled folder", siblings),
      parentId: currentId,
      ...nextFreeSpot(siblings, columns()),
      color: "blue",
      emoji: null,
      updatedAt: timestamp(),
    };
    commit([folder]);
    setQuery("");
    setSelectedId(folder.id);
    setRenamingId(folder.id);
  }

  function addFiles(
    list: File[],
    at: { x: number; y: number } | null,
    parentId: string | null = currentId,
  ) {
    const siblings = childrenOf(parentId);
    const created: FileItem[] = [];
    let skipped = 0;
    for (const file of list) {
      if (file.size > MAX_FILE_BYTES) {
        skipped++;
        continue;
      }
      const taken = [...siblings, ...created];
      const position =
        created.length === 0 && at && parentId === currentId
          ? at
          : nextFreeSpot(taken, columns());
      created.push({
        id: crypto.randomUUID(),
        kind: "file",
        name: uniqueName(file.name, taken),
        parentId,
        ...position,
        size: file.size,
        mime: file.type || "application/octet-stream",
        blob: file,
        updatedAt: timestamp(),
      });
    }
    if (created.length) {
      commit(created);
      if (parentId === currentId) setSelectedId(created[created.length - 1].id);
    }
    const where =
      parentId === currentId ? "" : ` to ${byId(parentId)?.name ?? "Space"}`;
    if (skipped) {
      showToast(
        `${skipped} file(s) over ${formatSize(MAX_FILE_BYTES)} were skipped`,
      );
    } else if (created.length) {
      showToast(
        `${created.length} file${created.length > 1 ? "s" : ""} added${where}`,
      );
    }
  }

  function rename(id: string, raw: string) {
    setRenamingId(null);
    const item = byId(id);
    const name = raw.trim();
    if (!item || !name || name === item.name) return;
    const siblings = childrenOf(item.parentId).filter((i) => i.id !== id);
    commit([
      { ...item, name: uniqueName(name, siblings), updatedAt: timestamp() },
    ]);
  }

  function move(id: string, x: number, y: number) {
    const item = byId(id);
    if (item) commit([{ ...item, x: Math.round(x), y: Math.round(y) }]);
  }

  function moveInto(id: string, folderId: string | null) {
    const item = byId(id);
    if (!item || item.parentId === folderId) return;
    if (
      item.kind === "folder" &&
      folderId &&
      (folderId === id || descendantIds(all, id).includes(folderId))
    ) {
      showToast("A folder can't be moved inside itself");
      return;
    }
    const siblings = childrenOf(folderId);
    commit([
      {
        ...item,
        parentId: folderId,
        name: uniqueName(item.name, siblings),
        ...nextFreeSpot(siblings, columns()),
        updatedAt: timestamp(),
      },
    ]);
    setSelectedId(null);
    showToast(`Moved to ${folderId ? byId(folderId)?.name : "Space"}`);
  }

  function saveStyle(folder: FolderItem, style: FolderStyle) {
    const siblings = childrenOf(folder.parentId).filter(
      (i) => i.id !== folder.id,
    );
    commit([
      {
        ...folder,
        ...style,
        name: uniqueName(style.name, siblings),
        updatedAt: timestamp(),
      },
    ]);
    setStyling(null);
  }

  function confirmDelete(item: SpaceItem) {
    const ids = [
      item.id,
      ...(item.kind === "folder" ? descendantIds(all, item.id) : []),
    ];
    all
      .filter((i): i is FileItem => i.kind === "file" && ids.includes(i.id))
      .forEach((f) => releaseThumbnail(f.blob));
    commit([], ids);
    setDeleting(null);
    setSelectedId(null);
    // Leave a folder that no longer exists.
    if (currentId && ids.includes(currentId)) {
      setHistory([null]);
      setHistoryIndex(0);
    }
  }

  function cleanUp() {
    const sorted = [...children].sort(
      (a, b) =>
        Number(b.kind === "folder") - Number(a.kind === "folder") ||
        a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
    const cols = Math.max(1, columns());
    commit(
      sorted.map((item, i) => ({
        ...item,
        x: CELL.pad + (i % cols) * CELL.w,
        y: CELL.pad + Math.floor(i / cols) * CELL.h,
      })),
    );
  }

  // ----- Menus -----

  function itemMenu(item: SpaceItem): MenuEntry[] {
    return [
      { label: "Open", icon: ExternalLink, onSelect: () => open(item) },
      ...(item.kind === "file"
        ? [
            {
              label: "Download",
              icon: Download,
              onSelect: () => download(item),
            },
          ]
        : []),
      "separator",
      { label: "Rename", icon: Pencil, onSelect: () => setRenamingId(item.id) },
      ...(item.kind === "folder"
        ? [
            {
              label: "Customize…",
              icon: Palette,
              onSelect: () => setStyling(item),
            },
          ]
        : []),
      "separator",
      {
        label: "Delete",
        icon: Trash2,
        danger: true,
        onSelect: () => setDeleting(item),
      },
    ];
  }

  const canvasMenu: MenuEntry[] = [
    { label: "New Folder", icon: FolderPlus, onSelect: newFolder },
    {
      label: "Upload Files…",
      icon: Upload,
      onSelect: () => uploadRef.current?.click(),
    },
    "separator",
    {
      label: "Clean Up by Name",
      icon: LayoutGrid,
      onSelect: cleanUp,
      disabled: view !== "icons" || children.length === 0,
    },
  ];

  function openMenu(e: React.MouseEvent, item: SpaceItem | null) {
    setMenu({ x: e.clientX, y: e.clientY, item });
  }
  const closeMenu = useCallback(() => setMenu(null), []);
  const closeStyling = useCallback(() => setStyling(null), []);
  const closeDeleting = useCallback(() => setDeleting(null), []);

  // ----- Keyboard shortcuts (Finder-style) -----

  useEffect(() => {
    keyHandler.current = (e: KeyboardEvent) => {
      if (isTyping(e.target) || menu || styling || deleting || renamingId)
        return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        newFolder();
      } else if (mod && e.key === "[") {
        goHistory(-1);
      } else if (mod && e.key === "]") {
        goHistory(1);
      } else if (mod && e.key === "ArrowUp" && currentFolder) {
        navigate(currentFolder.parentId);
      } else if (!selected) {
        return;
      } else if (e.key === "Enter") {
        e.preventDefault();
        setRenamingId(selected.id);
      } else if (
        mod &&
        (e.key === "ArrowDown" || e.key.toLowerCase() === "o")
      ) {
        e.preventDefault();
        open(selected);
      } else if (e.key === "Delete" || (mod && e.key === "Backspace")) {
        setDeleting(selected);
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    };
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // ----- Files dragged in from the computer -----

  function onFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setFileDragOver(false);
    const dropped = [...e.dataTransfer.files];
    if (!dropped.length) return;
    const folderEl = (e.target as Element).closest<HTMLElement>(
      "[data-drop-folder]",
    );
    if (folderEl?.dataset.dropFolder) {
      const id = folderEl.dataset.dropFolder;
      return addFiles(dropped, null, id === "root" ? null : id);
    }
    const canvas = canvasRef.current;
    if (view === "icons" && canvas) {
      const rect = canvas.getBoundingClientRect();
      return addFiles(dropped, {
        x: Math.max(
          0,
          e.clientX - rect.left + canvas.scrollLeft - (iconSize + 48) / 2,
        ),
        y: Math.max(0, e.clientY - rect.top + canvas.scrollTop - iconSize / 2),
      });
    }
    addFiles(dropped, null);
  }

  if (!items) {
    return (
      <div
        className="h-full animate-pulse rounded-2xl bg-white"
        aria-busy="true"
      />
    );
  }

  const navButton =
    "rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent";
  const toolButton =
    "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <section
      className="relative flex h-full min-h-[480px] overflow-hidden rounded-2xl bg-white"
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setFileDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setFileDragOver(false);
      }}
      onDrop={onFileDrop}
    >
      {/* Sidebar */}
      <aside
        style={
          { "--sidebar-width": `${sidebarWidth}px` } as React.CSSProperties
        }
        className="relative hidden w-(--sidebar-width) shrink-0 flex-col border-r border-slate-200 bg-slate-50/70 md:flex"
      >
        <ResizeHandle
          label="Resize sidebar"
          value={sidebarWidth}
          min={SIDEBAR_WIDTH.min}
          max={SIDEBAR_WIDTH.max}
          defaultValue={SIDEBAR_WIDTH.default}
          onChange={setSidebarWidth}
        />
        <div className="flex-1 overflow-y-auto p-3">
          <p className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            Favorites
          </p>
          <button
            type="button"
            data-drop-folder="root"
            onClick={() => navigate(null)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
              currentId === null
                ? "bg-slate-200/80 font-medium text-slate-800"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Orbit className="size-4 text-[#3f5068]" />
            My Space
          </button>

          <p className="px-2 pt-4 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            Folders
          </p>
          {topFolders
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((folder) => (
              <button
                key={folder.id}
                type="button"
                data-drop-folder={folder.id}
                onClick={() => navigate(folder.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  openMenu(e, folder);
                }}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm ${
                  path[0]?.id === folder.id
                    ? "bg-slate-200/80 font-medium text-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FolderIcon color={folder.color} emoji={null} size={18} />
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
        </div>
        <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          {files.length} file{files.length === 1 ? "" : "s"} ·{" "}
          {formatSize(usedBytes)} used
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2">
          <div className="flex">
            <button
              type="button"
              aria-label="Back"
              title="Back"
              disabled={historyIndex === 0}
              onClick={() => goHistory(-1)}
              className={navButton}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Forward"
              title="Forward"
              disabled={historyIndex >= history.length - 1}
              onClick={() => goHistory(1)}
              className={navButton}
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
          <h1 className="mr-auto min-w-0 truncate text-base font-semibold text-slate-800">
            {currentFolder?.name ?? "My Space"}
          </h1>

          <div
            role="group"
            aria-label="View"
            className="flex rounded-lg bg-slate-100 p-0.5"
          >
            {(
              [
                ["icons", LayoutGrid, "Icons"],
                ["list", List, "List"],
              ] as const
            ).map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                aria-label={`${label} view`}
                aria-pressed={view === value}
                title={`${label} view`}
                onClick={() => setView(value)}
                className={`rounded-md p-1 ${
                  view === value
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={newFolder}
            className={toolButton}
            title="New folder (⇧⌘N)"
          >
            <FolderPlus className="size-4" />
            <span className="hidden lg:inline">New Folder</span>
          </button>
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            className={toolButton}
            title="Upload files"
          >
            <Upload className="size-4" />
            <span className="hidden lg:inline">Upload</span>
          </button>
          <button
            type="button"
            aria-label="Actions for selected item"
            title="Actions"
            disabled={!selected}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              if (selected)
                setMenu({ x: r.left, y: r.bottom + 4, item: selected });
            }}
            className={toolButton}
          >
            <Ellipsis className="size-4" />
          </button>

          <div className="relative w-full sm:w-44">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label={`Search in ${currentFolder?.name ?? "My Space"}`}
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-1 pr-2 pl-8 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>
          <input
            ref={uploadRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              addFiles([...(e.target.files ?? [])], null);
              e.target.value = "";
            }}
          />
        </div>

        {view === "icons" ? (
          <IconCanvas
            items={visible}
            currentFolderId={currentId}
            selectedId={selectedId}
            renamingId={renamingId}
            iconSize={iconSize}
            scrollRef={canvasRef}
            onSelect={setSelectedId}
            onOpen={open}
            onMove={move}
            onMoveInto={moveInto}
            onRename={rename}
            onRenameCancel={() => setRenamingId(null)}
            onContextMenu={openMenu}
          />
        ) : (
          <ListView
            items={visible}
            selectedId={selectedId}
            renamingId={renamingId}
            onSelect={setSelectedId}
            onOpen={open}
            onRename={rename}
            onRenameCancel={() => setRenamingId(null)}
            onContextMenu={openMenu}
          />
        )}

        {/* Path bar and status */}
        <div className="flex items-center gap-3 border-t border-slate-200 px-3 py-1.5 text-xs text-slate-500">
          <nav
            aria-label="Path"
            className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
          >
            {[{ id: null, name: "My Space" }, ...path].map(
              (segment, i, list) => (
                <span
                  key={segment.id ?? "root"}
                  className="flex shrink-0 items-center gap-1"
                >
                  {i > 0 && <ChevronRight className="size-3 text-slate-300" />}
                  <button
                    type="button"
                    data-drop-folder={segment.id ?? "root"}
                    onClick={() => navigate(segment.id)}
                    aria-current={i === list.length - 1 ? "page" : undefined}
                    className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-slate-100 aria-[current=page]:font-medium aria-[current=page]:text-slate-700"
                  >
                    {segment.id === null ? (
                      <Orbit className="size-3.5" />
                    ) : (
                      <FolderOpen className="size-3.5" />
                    )}
                    {segment.name}
                  </button>
                </span>
              ),
            )}
          </nav>
          <span className="shrink-0">
            {visible.length} item{visible.length === 1 ? "" : "s"}
            {selected ? ", 1 selected" : ""}
            {!storageOk && " · not saved"}
          </span>
          {view === "icons" && (
            <input
              type="range"
              min={40}
              max={112}
              step={4}
              value={iconSize}
              onChange={(e) => setIconSize(Number(e.target.value))}
              aria-label="Icon size"
              className="hidden w-24 accent-[#3f5068] sm:block"
            />
          )}
        </div>
      </div>

      {fileDragOver && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-sky-400 bg-sky-50/60">
          <p className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-sky-700 shadow">
            Drop to add to {currentFolder?.name ?? "My Space"}
          </p>
        </div>
      )}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          label={menu.item ? `${menu.item.name} actions` : "Folder actions"}
          items={menu.item ? itemMenu(menu.item) : canvasMenu}
          onClose={closeMenu}
        />
      )}

      {styling && (
        <FolderStyleDialog
          folder={styling}
          onClose={closeStyling}
          onSave={(style) => saveStyle(styling, style)}
        />
      )}

      {deleting && (
        <Modal label="Delete item" onClose={closeDeleting}>
          <ModalHeader
            title={`Delete “${deleting.name}”?`}
            onClose={closeDeleting}
          />
          <p className="mt-3 text-slate-600">
            {deleting.kind === "folder" &&
            descendantIds(all, deleting.id).length
              ? `This folder and the ${descendantIds(all, deleting.id).length} item(s) inside it will be deleted. `
              : ""}
            This can&apos;t be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={closeDeleting}>
              Cancel
            </Button>
            <Button
              autoFocus
              variant="destructive"
              onClick={() => confirmDelete(deleting)}
            >
              Delete
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
