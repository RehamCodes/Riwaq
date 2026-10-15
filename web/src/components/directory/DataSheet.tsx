"use client";

import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Search,
  X,
} from "lucide-react";
import { Select, type SelectOption } from "@/components/ui";

const PER_PAGE = 20;

export type SheetColumn<T> = {
  key: string;
  label: string;
  // The value the column sorts by and exports to CSV.
  value: (row: T) => string;
  // What the cell shows; the plain value when left out.
  render?: (row: T) => React.ReactNode;
  className?: string;
};

export type SheetFilter<T> = {
  key: string;
  label: string;
  all: string;
  options: SelectOption[];
  // A list matches when any of its values is the one picked.
  value: (row: T) => string | string[];
};

// A filterable, sortable, paged sheet of records with CSV export.
export function DataSheet<T extends { id: string }>({
  title,
  noun,
  rows: allRows,
  columns,
  filters,
  search,
  searchPlaceholder,
  defaultSort,
  stickyColumn,
  fileName,
}: {
  title: string;
  noun: string;
  rows: T[];
  columns: SheetColumn<T>[];
  filters: SheetFilter<T>[];
  // The values the search box matches against.
  search: (row: T) => string[];
  searchPlaceholder: string;
  defaultSort: string;
  // Key of the column that stays visible when scrolling sideways.
  stickyColumn: string;
  fileName: string;
}) {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({
    key: defaultSort,
    dir: 1,
  });
  const [page, setPage] = useState(0);
  // The sheet scrolls on its own; the filters above it stay in place.
  const listRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const sortBy = columns.find((c) => c.key === sort.key)!.value;
  const active = filters.filter((f) => (picked[f.key] ?? "all") !== "all");
  const rows = allRows
    .filter(
      (r) =>
        active.every((f) => {
          const v = f.value(r);
          return Array.isArray(v)
            ? v.includes(picked[f.key])
            : v === picked[f.key];
        }) &&
        (!q || search(r).some((v) => v.toLowerCase().includes(q))),
    )
    .sort((a, b) => sort.dir * sortBy(a).localeCompare(sortBy(b)));

  const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const current = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(current * PER_PAGE, (current + 1) * PER_PAGE);

  function toggleSort(key: string) {
    setSort((s) => ({ key, dir: s.key === key ? (-s.dir as 1 | -1) : 1 }));
    setPage(0);
  }

  function goTo(p: number) {
    setPage(p);
    listRef.current?.scrollTo({ top: 0 });
  }

  function exportCsv() {
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [
      columns.map((c) => c.label),
      ...rows.map((r) => columns.map((c) => c.value(r))),
    ]
      .map((line) => line.map(cell).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  const control =
    "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-slate-400 focus:outline-none";
  // Header cells stick to the top of the scrolling sheet.
  const headCell =
    "sticky top-0 z-10 bg-white whitespace-nowrap shadow-[inset_0_-2px_0_#e2e8f0]";

  return (
    // Fills the screen: the header and filters stay put and the sheet pages.
    <section className="flex h-full min-h-140 flex-col rounded-2xl bg-white p-5">
      <div className="shrink-0">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {rows.length === allRows.length
                ? `${allRows.length} ${noun}`
                : `${rows.length} of ${allRows.length} ${noun}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder={searchPlaceholder}
                aria-label={`Search ${noun}`}
                className={`${control} w-60 pl-8`}
              />
            </div>
            <button
              type="button"
              onClick={exportCsv}
              disabled={rows.length === 0}
              className={`${control} flex items-center gap-2 hover:bg-slate-50 disabled:opacity-40`}
            >
              Export
              <FileDown className="size-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {filters.map((f) => {
            const value = picked[f.key] ?? "all";
            return (
              <Select
                key={f.key}
                label={f.label}
                value={value}
                onChange={(v) => {
                  setPicked((p) => ({ ...p, [f.key]: v }));
                  setPage(0);
                }}
                options={[{ value: "all", label: f.all }, ...f.options]}
                className={
                  value !== "all"
                    ? "border-brand/40 bg-brand-soft text-brand"
                    : ""
                }
              />
            );
          })}
          {(active.length > 0 || q) && (
            <button
              type="button"
              onClick={() => {
                setPicked({});
                setQuery("");
                setPage(0);
              }}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-brand hover:bg-slate-100"
            >
              <X className="size-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div ref={listRef} className="mt-4 min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr className="h-11">
              {columns.map((c) => {
                const sorted = sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    aria-sort={
                      sorted
                        ? sort.dir === 1
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={`${headCell} pr-4 font-medium ${
                      c.key === stickyColumn ? "left-0 z-20" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={`inline-flex items-center gap-1 hover:text-slate-700 ${
                        sorted ? "text-slate-800" : ""
                      }`}
                    >
                      {c.label}
                      {sorted &&
                        (sort.dir === 1 ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        ))}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr
                key={r.id}
                className="h-11 border-b border-slate-100 whitespace-nowrap hover:bg-slate-50/70"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`py-0 pr-4 ${
                      c.key === stickyColumn
                        ? "sticky left-0 bg-white font-medium text-slate-700"
                        : (c.className ?? "text-slate-600")
                    }`}
                  >
                    {c.render ? c.render(r) : c.value(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-400">
            No {noun} match these filters
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <nav
          aria-label="Pages"
          className="flex shrink-0 flex-wrap items-center gap-3 border-t border-slate-200 pt-3"
        >
          <p className="mr-auto text-xs text-slate-500 tabular-nums">
            {current * PER_PAGE + 1}–{current * PER_PAGE + pageRows.length} of{" "}
            {rows.length} {noun}
          </p>
          <PageButton
            label="Previous page"
            disabled={current === 0}
            onClick={() => goTo(current - 1)}
          >
            <ChevronLeft className="size-4" />
          </PageButton>
          <span className="text-sm text-slate-600 tabular-nums">
            Page {current + 1} / {pageCount}
          </span>
          <PageButton
            label="Next page"
            disabled={current >= pageCount - 1}
            onClick={() => goTo(current + 1)}
          >
            <ChevronRight className="size-4" />
          </PageButton>
        </nav>
      )}
    </section>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

// A small colored pill, for statuses.
export function Chip({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

// A phone number that dials on tap.
export function PhoneLink({ phone }: { phone: string }) {
  return (
    <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-brand">
      {phone}
    </a>
  );
}
