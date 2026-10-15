import { useSyncExternalStore } from "react";
import { classes, students as roster } from "@/components/attendance/register-data";

// The gradebook: one sheet of marks per class, subject and term. Sheets are
// saved in this browser until grades come from the server.

export { classes, roster };

export const subjects = [
  "Mathematics",
  "Science",
  "English",
  "Arabic Language",
  "Computer Science",
];

export const terms = ["Term 1", "Term 2", "Term 3"];

export type Assessment = {
  id: string;
  name: string;
  // Highest possible mark.
  max: number;
  // Share of the term grade, in percent.
  weight: number;
};

export type Sheet = {
  assessments: Assessment[];
  // studentId → assessmentId → mark. A missing mark is not entered yet.
  marks: Record<string, Record<string, number>>;
};

export function newAssessmentId() {
  return `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// ---- Grades ----

export type Letter = "A" | "B" | "C" | "D" | "F";

export function letterFor(percent: number): Letter {
  if (percent >= 90) return "A";
  if (percent >= 80) return "B";
  if (percent >= 70) return "C";
  if (percent >= 60) return "D";
  return "F";
}

export const PASS_MARK = 60;

// Weighted percent over the assessments that have a mark, so a student's
// grade so far isn't dragged down by work that isn't marked yet. null when
// nothing is marked.
export function totalFor(
  assessments: Assessment[],
  marks: Record<string, number> | undefined,
) {
  let earned = 0;
  let weights = 0;
  for (const a of assessments) {
    const mark = marks?.[a.id];
    if (mark === undefined || a.max <= 0) continue;
    earned += (mark / a.max) * a.weight;
    weights += a.weight;
  }
  return weights > 0 ? (earned / weights) * 100 : null;
}

export function average(values: number[]) {
  return values.length
    ? values.reduce((sum, v) => sum + v, 0) / values.length
    : null;
}

// ---- Sample sheet ----

const defaultAssessments: Assessment[] = [
  { id: "quiz1", name: "Quiz 1", max: 10, weight: 10 },
  { id: "quiz2", name: "Quiz 2", max: 10, weight: 10 },
  { id: "homework", name: "Homework", max: 20, weight: 15 },
  { id: "midterm", name: "Midterm", max: 50, weight: 25 },
  { id: "project", name: "Project", max: 30, weight: 15 },
  { id: "final", name: "Final exam", max: 100, weight: 25 },
];

// Stable pseudo-random number 0–99, so the sample marks are the same on
// every visit.
function roll(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100;
}

// Marks for everything except the final exam, which is still to be entered.
// A few marks are left blank, as if the work wasn't handed in yet.
function sampleSheet(key: string, className: string): Sheet {
  const marks: Sheet["marks"] = {};
  for (const s of roster.filter((s) => s.group === className)) {
    // Each student has a typical level, with some spread per assessment.
    const level = 55 + (roll(`${key}:${s.id}`) % 43);
    const row: Record<string, number> = {};
    for (const a of defaultAssessments.slice(0, -1)) {
      const n = roll(`${key}:${s.id}:${a.id}`);
      if (n < 4) continue;
      const percent = Math.min(100, Math.max(20, level + (n % 25) - 12));
      row[a.id] = Math.round((percent / 100) * a.max * 2) / 2;
    }
    marks[s.id] = row;
  }
  return { assessments: defaultAssessments, marks };
}

// ---- Storage ----

export function sheetKey(className: string, subject: string, term: string) {
  return `riwaq-gradebook:${className}:${subject}:${term}`;
}

// Parsed sheets, so useSyncExternalStore gets the same object back until
// the sheet changes.
const cache = new Map<string, Sheet>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readSheet(key: string, className: string) {
  let sheet = cache.get(key);
  if (sheet) return sheet;
  try {
    const saved = localStorage.getItem(key);
    if (saved) sheet = JSON.parse(saved) as Sheet;
  } catch {
    // Unreadable or blocked storage: fall back to the sample.
  }
  sheet ??= sampleSheet(key, className);
  cache.set(key, sheet);
  return sheet;
}

export function saveSheet(key: string, sheet: Sheet) {
  cache.set(key, sheet);
  try {
    localStorage.setItem(key, JSON.stringify(sheet));
  } catch {
    // Storage full or blocked: keep the change for this visit.
  }
  listeners.forEach((l) => l());
}

// The sheet for a class, subject and term; null while prerendering.
export function useSheet(className: string, subject: string, term: string) {
  const key = sheetKey(className, subject, term);
  const sheet = useSyncExternalStore(
    subscribe,
    () => readSheet(key, className),
    () => null,
  );
  return { key, sheet };
}
