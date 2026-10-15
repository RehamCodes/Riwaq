"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  FileDown,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  Button,
  ContextMenu,
  Input,
  Modal,
  ModalHeader,
  Select,
} from "@/components/ui";
import {
  average,
  classes,
  letterFor,
  newAssessmentId,
  PASS_MARK,
  roster,
  saveSheet,
  subjects,
  terms,
  totalFor,
  useSheet,
  type Assessment,
  type Letter,
  type Sheet,
} from "./gradebook-data";

const letterStyles: Record<Letter, string> = {
  A: "bg-emerald-50 text-emerald-700",
  B: "bg-sky-50 text-sky-700",
  C: "bg-amber-50 text-amber-800",
  D: "bg-orange-50 text-orange-700",
  F: "bg-rose-50 text-rose-700",
};

function formatPercent(value: number | null) {
  return value === null ? "–" : `${value.toFixed(1)}%`;
}

function formatMark(value: number | null) {
  return value === null ? "–" : String(Math.round(value * 10) / 10);
}

function LetterChip({ percent }: { percent: number | null }) {
  if (percent === null) return <span className="text-slate-300">–</span>;
  const letter = letterFor(percent);
  return (
    <span
      className={`inline-flex w-7 justify-center rounded-full py-0.5 text-xs font-semibold ${letterStyles[letter]}`}
    >
      {letter}
    </span>
  );
}

export default function Gradebook() {
  const [className, setClassName] = useState(classes[0]);
  const [subject, setSubject] = useState(subjects[0]);
  const [term, setTerm] = useState(terms[0]);
  const [query, setQuery] = useState("");
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  // The assessment being added (null id) or edited.
  const [editing, setEditing] = useState<Assessment | "new" | null>(null);
  const [deleting, setDeleting] = useState<Assessment | null>(null);
  const [menu, setMenu] = useState<{
    assessment: Assessment;
    x: number;
    y: number;
  } | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const { key, sheet } = useSheet(className, subject, term);

  if (!sheet) {
    return (
      <div
        className="h-96 animate-pulse rounded-2xl bg-white"
        aria-busy="true"
      />
    );
  }

  const { assessments, marks } = sheet;
  const save = (next: Sheet) => saveSheet(key, next);

  function setMark(
    studentId: string,
    assessmentId: string,
    mark: number | null,
  ) {
    const row = { ...marks[studentId] };
    if (mark === null) delete row[assessmentId];
    else row[assessmentId] = mark;
    save({ assessments, marks: { ...marks, [studentId]: row } });
  }

  const students = roster.filter((s) => s.group === className);
  const totals = new Map(
    students.map((s) => [s.id, totalFor(assessments, marks[s.id])]),
  );
  const isAtRisk = (id: string) => {
    const total = totals.get(id);
    return total != null && total < PASS_MARK;
  };

  const q = query.trim().toLowerCase();
  const rows = students.filter(
    (s) =>
      (!q || s.name.toLowerCase().includes(q)) &&
      (!atRiskOnly || isAtRisk(s.id)),
  );

  // Summary for the whole class, not just the filtered rows.
  const classTotals = students
    .map((s) => totals.get(s.id))
    .filter((t): t is number => t != null);
  const classAverage = average(classTotals);
  const entered = students.reduce(
    (sum, s) =>
      sum + assessments.filter((a) => marks[s.id]?.[a.id] !== undefined).length,
    0,
  );
  const possible = students.length * assessments.length;
  const atRisk = students.filter((s) => isAtRisk(s.id)).length;
  const weightSum = assessments.reduce((sum, a) => sum + a.weight, 0);

  // Enter / ↑ / ↓ move between students in the same column, like a sheet.
  function moveFocus(row: number, col: number) {
    tableRef.current
      ?.querySelector<HTMLInputElement>(`[data-cell="${row}:${col}"]`)
      ?.focus();
  }

  function exportCsv() {
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = [
      "Name",
      ...assessments.map((a) => `${a.name} (/${a.max})`),
      "Total %",
      "Grade",
    ];
    const lines = rows.map((s) => {
      const total = totals.get(s.id) ?? null;
      return [
        s.name,
        ...assessments.map((a) => String(marks[s.id]?.[a.id] ?? "")),
        total === null ? "" : total.toFixed(1),
        total === null ? "" : letterFor(total),
      ];
    });
    const csv = [header, ...lines]
      .map((line) => line.map(cell).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `grades-${className}-${subject}-${term}.csv`
      .toLowerCase()
      .replace(/\s+/g, "-");
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  const control =
    "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-slate-400 focus:outline-none";
  // Header and footer cells stick to the edges of the scrolling sheet.
  const headCell =
    "sticky top-0 z-10 bg-white shadow-[inset_0_-2px_0_#e2e8f0] align-bottom";
  const footCell =
    "sticky bottom-0 z-10 bg-slate-50 shadow-[inset_0_1px_0_#e2e8f0]";

  return (
    // Fills the screen: the header and filters stay put and the sheet scrolls.
    <section className="flex h-full min-h-140 flex-col rounded-2xl bg-white p-5">
      <div className="shrink-0">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200">
          <div className="pb-3">
            <h1 className="text-xl font-semibold text-slate-800">Assessment</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Marks are saved on this device as you type.
            </p>
          </div>
          <div role="tablist" aria-label="Term" className="flex gap-6">
            {terms.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={term === t}
                onClick={() => setTerm(t)}
                className={`-mb-px border-b-2 pb-3 text-sm font-medium ${
                  term === t
                    ? "border-brand text-slate-800"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Select
            label="Class"
            value={className}
            onChange={setClassName}
            options={classes.map((c) => ({ value: c, label: `Class ${c}` }))}
          />
          <Select
            label="Subject"
            value={subject}
            onChange={setSubject}
            options={subjects.map((s) => ({ value: s, label: s }))}
          />

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
            <Button onClick={() => setEditing("new")} className="py-1.5">
              <Plus className="size-4" />
              Add assessment
            </Button>
          </div>
        </div>

        {/* Class summary */}
        <ul
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
          aria-label="Class summary"
        >
          <Stat label="Class average" value={formatPercent(classAverage)}>
            <LetterChip percent={classAverage} />
          </Stat>
          <Stat label="Marks entered" value={`${entered} / ${possible}`}>
            <span className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
              <span
                className="block h-full rounded-full bg-brand"
                style={{
                  width: `${possible ? (entered / possible) * 100 : 0}%`,
                }}
              />
            </span>
          </Stat>
          <Stat label="Students" value={String(students.length)} />
          <li>
            <button
              type="button"
              aria-pressed={atRiskOnly}
              onClick={() => setAtRiskOnly((v) => !v)}
              className={`flex h-full w-full flex-col items-start rounded-xl border px-4 py-3 text-left ${
                atRiskOnly
                  ? "border-rose-300 bg-rose-50/60"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <AlertTriangle className="size-3.5 text-rose-500" />
                Below {PASS_MARK}%
              </span>
              <span className="mt-1 text-lg font-semibold text-slate-800 tabular-nums">
                {atRisk}
              </span>
            </button>
          </li>
        </ul>

        {weightSum !== 100 && assessments.length > 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-700">
            <AlertTriangle className="size-3.5" />
            Weights add up to {weightSum}%, not 100%. Totals are scaled to fit.
          </p>
        )}
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-auto">
        <table
          ref={tableRef}
          className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm"
        >
          <thead className="text-xs text-slate-500">
            <tr>
              <th
                className={`${headCell} left-0 z-20 py-2 pr-4 font-semibold tracking-wide uppercase`}
              >
                Student
              </th>
              {assessments.map((a) => (
                <th key={a.id} className={`${headCell} px-1 py-2 font-medium`}>
                  <div className="flex items-start justify-center gap-0.5">
                    <div className="text-center">
                      <span className="block font-semibold whitespace-nowrap text-slate-700">
                        {a.name}
                      </span>
                      <span className="tabular-nums">
                        /{a.max} · {a.weight}%
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label={`${a.name} options`}
                      onClick={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setMenu({ assessment: a, x: r.left, y: r.bottom + 4 });
                      }}
                      className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <MoreVertical className="size-3.5" />
                    </button>
                  </div>
                </th>
              ))}
              <th className={`${headCell} py-2 pl-4 text-right font-medium`}>
                Total
              </th>
              <th className={`${headCell} py-2 pl-4 text-center font-medium`}>
                Grade
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, row) => {
              const total = totals.get(s.id) ?? null;
              return (
                <tr key={s.id} className="group">
                  <td className="sticky left-0 z-10 border-b border-slate-100 bg-white py-1 pr-4 whitespace-nowrap text-slate-700 group-hover:bg-slate-50">
                    {s.name}
                  </td>
                  {assessments.map((a, col) => (
                    <td
                      key={a.id}
                      className="border-b border-slate-100 px-1 py-1 text-center group-hover:bg-slate-50/70"
                    >
                      <GradeCell
                        mark={marks[s.id]?.[a.id]}
                        max={a.max}
                        label={`${s.name}, ${a.name}`}
                        cell={`${row}:${col}`}
                        onCommit={(mark) => setMark(s.id, a.id, mark)}
                        onMove={(dir) => moveFocus(row + dir, col)}
                      />
                    </td>
                  ))}
                  <td
                    className={`border-b border-slate-100 py-1 pl-4 text-right font-medium tabular-nums group-hover:bg-slate-50/70 ${
                      total !== null && total < PASS_MARK
                        ? "text-rose-600"
                        : "text-slate-700"
                    }`}
                  >
                    {formatPercent(total)}
                  </td>
                  <td className="border-b border-slate-100 py-1 pl-4 text-center group-hover:bg-slate-50/70">
                    <LetterChip percent={total} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="text-xs text-slate-500">
              <tr className="h-10">
                <td className={`${footCell} left-0 z-20 pr-4 font-medium`}>
                  Average
                </td>
                {assessments.map((a) => (
                  <td
                    key={a.id}
                    className={`${footCell} text-center tabular-nums`}
                  >
                    {formatMark(
                      average(
                        rows
                          .map((s) => marks[s.id]?.[a.id])
                          .filter((m): m is number => m !== undefined),
                      ),
                    )}
                  </td>
                ))}
                <td
                  className={`${footCell} pl-4 text-right font-medium text-slate-700 tabular-nums`}
                >
                  {formatPercent(
                    average(
                      rows
                        .map((s) => totals.get(s.id))
                        .filter((t): t is number => t != null),
                    ),
                  )}
                </td>
                <td className={footCell} />
              </tr>
            </tfoot>
          )}
        </table>
        {rows.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-400">
            No students match these filters
          </p>
        )}
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          label={`${menu.assessment.name} options`}
          onClose={() => setMenu(null)}
          items={[
            {
              label: "Edit",
              icon: Pencil,
              onSelect: () => setEditing(menu.assessment),
            },
            {
              label: "Delete",
              icon: Trash2,
              danger: true,
              onSelect: () => setDeleting(menu.assessment),
            },
          ]}
        />
      )}

      {editing && (
        <AssessmentDialog
          assessment={editing === "new" ? null : editing}
          otherWeights={assessments
            .filter((a) => editing === "new" || a.id !== editing.id)
            .reduce((sum, a) => sum + a.weight, 0)}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            const exists = assessments.some((a) => a.id === next.id);
            save({
              assessments: exists
                ? assessments.map((a) => (a.id === next.id ? next : a))
                : [...assessments, next],
              marks,
            });
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <Modal label="Delete assessment" onClose={() => setDeleting(null)}>
          <ModalHeader
            title={`Delete ${deleting.name}?`}
            onClose={() => setDeleting(null)}
          />
          <p className="mt-2 text-slate-500">
            Its marks for every student in Class {className} will be removed.
            This can&apos;t be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                save({
                  assessments: assessments.filter((a) => a.id !== deleting.id),
                  marks: Object.fromEntries(
                    Object.entries(marks).map(([id, row]) => [
                      id,
                      Object.fromEntries(
                        Object.entries(row).filter(([a]) => a !== deleting.id),
                      ),
                    ]),
                  ),
                });
                setDeleting(null);
              }}
            >
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="rounded-xl border border-slate-200 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 flex items-center justify-between gap-2">
        <span className="text-lg font-semibold text-slate-800 tabular-nums">
          {value}
        </span>
        {children}
      </p>
    </li>
  );
}

// One mark. While focused it holds what's typed; the mark is saved on
// Enter, an arrow move or leaving the cell, and only if it's valid.
function GradeCell({
  mark,
  max,
  label,
  cell,
  onCommit,
  onMove,
}: {
  mark: number | undefined;
  max: number;
  label: string;
  cell: string;
  onCommit: (mark: number | null) => void;
  onMove: (dir: 1 | -1) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? (mark === undefined ? "" : String(mark));
  const parsed = text.trim() === "" ? null : Number(text);
  const invalid =
    parsed !== null && (Number.isNaN(parsed) || parsed < 0 || parsed > max);

  function commit() {
    if (draft !== null && !invalid && parsed !== (mark ?? null))
      onCommit(parsed);
    setDraft(null);
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      data-cell={cell}
      aria-label={label}
      aria-invalid={invalid}
      title={invalid ? `Enter a mark from 0 to ${max}` : undefined}
      value={text}
      placeholder="–"
      onFocus={(e) => {
        setDraft(text);
        e.target.select();
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setDraft(null);
          e.currentTarget.blur();
        } else if (e.key === "Enter" || e.key === "ArrowDown") {
          e.preventDefault();
          onMove(e.shiftKey && e.key === "Enter" ? -1 : 1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          onMove(-1);
        }
      }}
      className={`h-8 w-16 rounded-md border text-center tabular-nums placeholder:text-slate-300 focus:outline-none ${
        invalid
          ? "border-rose-400 bg-rose-50 text-rose-700"
          : "border-transparent text-slate-700 hover:border-slate-200 focus:border-brand focus:bg-white"
      }`}
    />
  );
}

function AssessmentDialog({
  assessment,
  otherWeights,
  onClose,
  onSave,
}: {
  assessment: Assessment | null;
  // Total weight of the other assessments, to suggest what's left.
  otherWeights: number;
  onClose: () => void;
  onSave: (assessment: Assessment) => void;
}) {
  const [name, setName] = useState(assessment?.name ?? "");
  const [max, setMax] = useState(String(assessment?.max ?? 10));
  const [weight, setWeight] = useState(
    String(assessment?.weight ?? Math.max(0, 100 - otherWeights)),
  );
  const maxValue = Number(max);
  const weightValue = Number(weight);
  const valid =
    name.trim() !== "" &&
    maxValue > 0 &&
    weight.trim() !== "" &&
    weightValue >= 0 &&
    weightValue <= 100;
  const after = otherWeights + (Number.isNaN(weightValue) ? 0 : weightValue);

  return (
    <Modal
      label={assessment ? "Edit assessment" : "Add assessment"}
      onClose={onClose}
    >
      <ModalHeader
        title={assessment ? "Edit assessment" : "Add assessment"}
        onClose={onClose}
      />
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSave({
            id: assessment?.id ?? newAssessmentId(),
            name: name.trim(),
            max: maxValue,
            weight: weightValue,
          });
        }}
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Name
          </span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quiz 3"
            autoFocus
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">
              Out of
            </span>
            <Input
              type="number"
              min={1}
              step="any"
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">
              Weight (%)
            </span>
            <Input
              type="number"
              min={0}
              max={100}
              step="any"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </label>
        </div>
        <p
          className={`text-xs ${after === 100 ? "text-slate-500" : "text-amber-700"}`}
        >
          All weights will add up to {after}%
          {after === 100 ? "." : " — totals are scaled to fit."}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!valid}>
            {assessment ? "Save" : "Add"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
