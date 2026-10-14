"use client";

import { ItemIcon } from "./icons";
import RenameInput from "./RenameInput";
import { fileKind, formatSize, type SpaceItem } from "./types";

function formatModified(time: number) {
  return new Date(time).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ListView({
  items,
  selectedId,
  renamingId,
  renderBadge,
  onSelect,
  onOpen,
  onRename,
  onRenameCancel,
  onContextMenu,
}: {
  items: SpaceItem[];
  selectedId: string | null;
  renamingId: string | null;
  renderBadge?: (item: SpaceItem) => React.ReactNode;
  onSelect: (id: string | null) => void;
  onOpen: (item: SpaceItem) => void;
  onRename: (id: string, name: string) => void;
  onRenameCancel: () => void;
  onContextMenu: (e: React.MouseEvent, item: SpaceItem | null) => void;
}) {
  // Folders first, then by name, like Finder.
  const sorted = [...items].sort(
    (a, b) =>
      Number(b.kind === "folder") - Number(a.kind === "folder") ||
      a.name.localeCompare(b.name, undefined, { numeric: true }),
  );

  return (
    <div
      className="flex-1 overflow-auto"
      onPointerDown={(e) => {
        if (!(e.target as Element).closest("tbody tr")) onSelect(null);
      }}
      onContextMenu={(e) => {
        if ((e.target as Element).closest("tbody tr")) return;
        e.preventDefault();
        onSelect(null);
        onContextMenu(e, null);
      }}
    >
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-white text-xs text-slate-500">
          <tr className="border-b border-slate-200">
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Date Modified</th>
            <th className="px-4 py-2 font-medium">Size</th>
            <th className="px-4 py-2 font-medium">Kind</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, i) => {
            const selected = item.id === selectedId;
            return (
              <tr
                key={item.id}
                data-drop-folder={item.kind === "folder" ? item.id : undefined}
                onClick={() => onSelect(item.id)}
                onDoubleClick={() => onOpen(item)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onSelect(item.id);
                  onContextMenu(e, item);
                }}
                className={`cursor-default select-none ${
                  selected
                    ? "bg-brand text-white"
                    : i % 2
                      ? "bg-slate-50/70 text-slate-700"
                      : "text-slate-700"
                }`}
              >
                <td className="px-4 py-1.5">
                  <div className="flex items-center gap-2">
                    <ItemIcon item={item} size={22} />
                    {renamingId === item.id ? (
                      <RenameInput
                        name={item.name}
                        onCommit={(name) => onRename(item.id, name)}
                        onCancel={onRenameCancel}
                        className="text-sm"
                      />
                    ) : (
                      <button
                        type="button"
                        onFocus={() => onSelect(item.id)}
                        className="truncate text-left focus-visible:underline focus-visible:outline-none"
                      >
                        {item.name}
                      </button>
                    )}
                    {renderBadge?.(item)}
                  </div>
                </td>
                <td
                  className={`px-4 py-1.5 whitespace-nowrap ${selected ? "" : "text-slate-500"}`}
                >
                  {formatModified(item.updatedAt)}
                </td>
                <td
                  className={`px-4 py-1.5 whitespace-nowrap ${selected ? "" : "text-slate-500"}`}
                >
                  {item.kind === "file" ? formatSize(item.size) : "--"}
                </td>
                <td
                  className={`px-4 py-1.5 whitespace-nowrap ${selected ? "" : "text-slate-500"}`}
                >
                  {item.kind === "folder" ? "Folder" : fileKind(item).label}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {items.length === 0 && (
        <p className="py-16 text-center text-sm text-slate-400">
          This folder is empty
        </p>
      )}
    </div>
  );
}
