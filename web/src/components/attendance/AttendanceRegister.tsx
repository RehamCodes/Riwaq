"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  FileDown,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { DateInput } from "@/components/ui";
import { useNow } from "@/components/calendar/use-now";
import {
  addDays,
  formatLongDate,
  isSameDay,
  startOfDay,
  startOfWeek,
  toDateInputValue,
  weekdayShort,
  WORK_DAYS,
} from "@/components/calendar/date-utils";
import {
  classes,
  isSchoolDay,
  recordFor,
  roster,
  statuses,
  type AttendanceRecord,
  type RegisterStudent,
  type Status,
} from "./register-data";

type View = "day" | "week";

const PER_PAGE = 20;

const statusStyles: Record<
  Status,
  { label: string; icon: LucideIcon; dot: string; chip: string }
> = {
  present: {
    label: "Present",
    icon: Check,
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700",
  },
  late: {
    label: "Late",
    icon: Clock,
    dot: "bg-amber-400",
    chip: "bg-amber-50 text-amber-800",
  },
  absent: {
    label: "Absent",
    icon: X,
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700",
  },
  excused: {
    label: "Excused",
    icon: FileCheck,
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700",
  },
};

// The given day, or the school day before it on a weekend.
function latestSchoolDay(date: Date) {
  let d = startOfDay(date);
  while (!isSchoolDay(d)) d = addDays(d, -1);
  return d;
}

function schoolDaysOfWeek(date: Date) {
  const start = startOfWeek(date);
  return WORK_DAYS.map((n) => addDays(start, n));
}

function shiftSchoolDay(date: Date, dir: 1 | -1) {
  let d = addDays(date, dir);
  while (!isSchoolDay(d)) d = addDays(d, dir);
  return d;
}

function weekLabel(days: Date[]) {
  const first = days[0];
  const last = days[days.length - 1];
  const month = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });
  return first.getMonth() === last.getMonth()
    ? `${month(first)} ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`
    : `${month(first)} ${first.getDate()} – ${month(last)} ${last.getDate()}, ${last.getFullYear()}`;
}

function StatusIcon({ record }: { record: AttendanceRecord | null }) {
  if (!record)
    return (
      <span className="text-slate-300" aria-label="Not taken">
        –
      </span>
    );
  const { label, icon: Icon, dot } = statusStyles[record.status];
  return (
    <span
      role="img"
      aria-label={label}
      title={record.arrival ? `${label} · ${record.arrival}` : label}
      className={`inline-flex size-6 items-center justify-center rounded-full text-white ${dot}`}
    >
      <Icon className="size-3.5" strokeWidth={3} />
    </span>
  );
}

function StatusChip({ status }: { status: Status }) {
  const { label, icon: Icon, chip } = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${chip}`}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {label}
    </span>
  );
}

export default function AttendanceRegister() {
  const now = useNow();
  const [view, setView] = useState<View>("week");
  // null = follow today.
  const [picked, setPicked] = useState<Date | null>(null);
  const [className, setClassName] = useState("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  // The list scrolls on its own; the controls above it stay in place.
  const listRef = useRef<HTMLDivElement>(null);

  if (!now) {
    return (
      <div
        className="h-96 animate-pulse rounded-2xl bg-white"
        aria-busy="true"
      />
    );
  }

  const today = startOfDay(now);
  const anchor = latestSchoolDay(picked ?? today);
  const days = view === "week" ? schoolDaysOfWeek(anchor) : [anchor];
  const onCurrent =
    view === "week"
      ? isSameDay(startOfWeek(anchor), startOfWeek(today))
      : isSameDay(anchor, latestSchoolDay(today));
  const next = view === "week" ? addDays(anchor, 7) : shiftSchoolDay(anchor, 1);
  const canGoNext =
    view === "week" ? startOfWeek(next) <= today : next <= today;

  function go(dir: 1 | -1) {
    setPage(0);
    setPicked(
      view === "week" ? addDays(anchor, 7 * dir) : shiftSchoolDay(anchor, dir),
    );
  }

  const records = new Map(
    roster.map((s) => [s.id, days.map((d) => recordFor(s, d, today))]),
  );
  const q = query.trim().toLowerCase();
  const rows = roster.filter(
    (s) =>
      (className === "all" || s.className === className) &&
      (!q || s.name.toLowerCase().includes(q)) &&
      (statusFilter === "all" ||
        records.get(s.id)!.some((r) => r?.status === statusFilter)),
  );

  const counts = Object.fromEntries(
    statuses.map((status) => [
      status,
      rows.reduce(
        (sum, s) =>
          sum + records.get(s.id)!.filter((r) => r?.status === status).length,
        0,
      ),
    ]),
  ) as Record<Status, number>;

  const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const current = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(current * PER_PAGE, (current + 1) * PER_PAGE);

  function exportCsv() {
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = [
      "Name",
      "Class",
      ...days.map(toDateInputValue),
      ...(view === "day" ? ["Arrival"] : []),
    ];
    const lines = rows.map((s) => {
      const recs = records.get(s.id)!;
      return [
        s.name,
        s.className,
        ...recs.map((r) => (r ? statusStyles[r.status].label : "")),
        ...(view === "day" ? [recs[0]?.arrival ?? ""] : []),
      ];
    });
    const csv = [header, ...lines]
      .map((line) => line.map(cell).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${view}-${toDateInputValue(days[0])}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  const control =
    "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-slate-400 focus:outline-none";
  // Header cells stick to the top of the scrolling list.
  const headCell = "sticky top-0 z-10 bg-white shadow-[inset_0_-2px_0_#e2e8f0]";
  const navButton =
    "rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    // Fills the screen: the header and filters stay put and the list pages.
    <section className="flex h-full min-h-140 flex-col rounded-2xl bg-white p-5">
      <div className="shrink-0">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-400">
          <Link
            href="/attendance"
            className="inline-flex items-center gap-1 hover:text-slate-600"
          >
            <ArrowLeft className="size-3.5" />
            Attendance overview
          </Link>
        </nav>

        <div className="mt-3 flex items-end justify-between gap-4 border-b border-slate-200">
          <h1 className="pb-3 text-xl font-semibold text-slate-800">
            Attendance
          </h1>
          <div role="tablist" aria-label="Period" className="flex gap-6">
            {(["day", "week"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => {
                  setView(v);
                  setPage(0);
                }}
                className={`-mb-px border-b-2 pb-3 text-sm font-medium capitalize ${
                  view === v
                    ? "border-brand text-slate-800"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={view === "week" ? "Previous week" : "Previous day"}
              onClick={() => go(-1)}
              className={navButton}
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="hidden min-w-44 text-center text-sm font-medium text-slate-700 sm:inline">
              {view === "week" ? weekLabel(days) : formatLongDate(anchor)}
            </span>
            <div className="w-40">
              <DateInput
                value={toDateInputValue(anchor)}
                max={toDateInputValue(today)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [y, m, d] = e.target.value.split("-").map(Number);
                  setPicked(new Date(y, m - 1, d));
                  setPage(0);
                }}
                aria-label="Go to date"
                className="py-1.5"
              />
            </div>
            <button
              type="button"
              aria-label={view === "week" ? "Next week" : "Next day"}
              onClick={() => go(1)}
              disabled={!canGoNext}
              className={navButton}
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
          {!onCurrent && (
            <button
              type="button"
              onClick={() => {
                setPicked(null);
                setPage(0);
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand hover:bg-slate-100"
            >
              {view === "week" ? "This week" : "Today"}
            </button>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              value={className}
              onChange={(e) => {
                setClassName(e.target.value);
                setPage(0);
              }}
              aria-label="Class"
              className={control}
            >
              <option value="all">All classes</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as Status | "all");
                setPage(0);
              }}
              aria-label="Status"
              className={control}
            >
              <option value="all">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusStyles[s].label}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search students"
                aria-label="Search students"
                className={`${control} w-44 pl-8`}
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

        {/* Totals for what's shown */}
        <ul
          className="mt-4 flex gap-2 overflow-x-auto sm:flex-wrap"
          aria-label="Totals"
        >
          {statuses.map((s) => (
            <li key={s} className="shrink-0">
              <button
                type="button"
                aria-pressed={statusFilter === s}
                onClick={() => {
                  setStatusFilter((f) => (f === s ? "all" : s));
                  setPage(0);
                }}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                  statusFilter === s
                    ? "border-slate-400 bg-slate-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <StatusChip status={s} />
                <span className="font-semibold text-slate-800 tabular-nums">
                  {counts[s]}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {view === "day" && !picked && !isSchoolDay(today) && (
          <p className="mt-3 text-xs text-slate-500">
            No school today — showing {formatLongDate(anchor)}.
          </p>
        )}
      </div>

      <div ref={listRef} className="mt-4 min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr className="h-14">
              <th
                className={`${headCell} left-0 z-20 pr-4 font-semibold tracking-wide uppercase`}
              >
                Name
              </th>
              <th className={`${headCell} pr-4 font-medium`}>Class</th>
              {view === "week" ? (
                <>
                  {days.map((d) => (
                    <th
                      key={d.getTime()}
                      className={`${headCell} text-center font-medium ${
                        isSameDay(d, today) ? "text-brand" : ""
                      }`}
                    >
                      {weekdayShort(d)}
                      <span className="block text-sm font-semibold text-slate-700">
                        {d.getDate()}
                      </span>
                    </th>
                  ))}
                  <th className={`${headCell} pl-4 text-right font-medium`}>
                    Present
                  </th>
                </>
              ) : (
                <>
                  <th className={`${headCell} pr-4 font-medium`}>Status</th>
                  <th className={`${headCell} font-medium`}>Arrival</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((s) => (
              <Row
                key={s.id}
                student={s}
                records={records.get(s.id)!}
                view={view}
              />
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-400">
            No students match these filters
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <Pagination
          page={current}
          pageCount={pageCount}
          from={current * PER_PAGE + 1}
          to={current * PER_PAGE + pageRows.length}
          total={rows.length}
          onPage={(p) => {
            setPage(p);
            listRef.current?.scrollTo({ top: 0 });
          }}
        />
      )}
    </section>
  );
}

function Row({
  student,
  records,
  view,
}: {
  student: RegisterStudent;
  records: (AttendanceRecord | null)[];
  view: View;
}) {
  const taken = records.filter((r) => r !== null);
  const attended = taken.filter(
    (r) => r.status === "present" || r.status === "late",
  ).length;

  return (
    <tr className="h-11 border-b border-slate-100 hover:bg-slate-50/70">
      <td className="sticky left-0 bg-white py-0 pr-4 text-slate-700">
        {student.name}
      </td>
      <td className="py-0 pr-4 text-slate-500">{student.className}</td>
      {view === "week" ? (
        <>
          {records.map((r, i) => (
            <td key={i} className="py-0 text-center">
              <StatusIcon record={r} />
            </td>
          ))}
          <td className="py-0 pl-4 text-right text-slate-600 tabular-nums">
            {taken.length ? `${attended}/${taken.length}` : "–"}
          </td>
        </>
      ) : (
        <>
          <td className="py-0 pr-4">
            {records[0] ? (
              <StatusChip status={records[0].status} />
            ) : (
              <span className="text-slate-300">Not taken</span>
            )}
          </td>
          <td className="py-0 text-slate-500 tabular-nums">
            {records[0]?.arrival ?? "–"}
          </td>
        </>
      )}
    </tr>
  );
}

function Pagination({
  page,
  pageCount,
  from,
  to,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const button =
    "flex size-8 items-center justify-center rounded-lg text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <nav
      aria-label="Pages"
      className="flex shrink-0 flex-wrap items-center gap-3 border-t border-slate-200 pt-3"
    >
      <p className="mr-auto text-xs text-slate-500 tabular-nums">
        {from}–{to} of {total} students
      </p>
      <button
        type="button"
        aria-label="Previous page"
        disabled={page === 0}
        onClick={() => onPage(page - 1)}
        className={button}
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="text-sm text-slate-600 tabular-nums sm:hidden">
        Page {page + 1} / {pageCount}
      </span>
      {Array.from({ length: pageCount }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Page ${i + 1}`}
          aria-current={i === page ? "page" : undefined}
          onClick={() => onPage(i)}
          className={`${button} hidden tabular-nums sm:flex ${
            i === page
              ? "bg-brand font-medium text-white hover:bg-brand-hover"
              : ""
          }`}
        >
          {i + 1}
        </button>
      ))}
      <button
        type="button"
        aria-label="Next page"
        disabled={page >= pageCount - 1}
        onClick={() => onPage(page + 1)}
        className={button}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
