import {
  CELL,
  type FolderColor,
  type FolderItem,
  type SpaceItem,
} from "@/components/space/types";

// The fixed top-level folders. Teachers add a folder inside one of these
// for each exam, quiz, … and set its access.
const categoryList: [string, string, FolderColor, string][] = [
  ["exams", "Exams", "red", "📝"],
  ["quizzes", "Quizzes", "orange", "✏️"],
  ["midterms", "Midterms", "purple", "🏆"],
  ["activities", "Activities", "green", "🎨"],
];

const categoryIds = new Set(categoryList.map(([id]) => id));

export function isCategory(item: { id: string }) {
  return categoryIds.has(item.id);
}

export function sampleCategories(now: number): FolderItem[] {
  return categoryList.map(([id, name, color, emoji], i) => ({
    id,
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

export type Student = { id: string; name: string; grade: string };

// Sample roster until students come from the server.
export const students: Student[] = [
  { id: "yousef", name: "Yousef Ali", grade: "Grade 8" },
  { id: "mariam", name: "Mariam Adel", grade: "Grade 7" },
  { id: "lina", name: "Lina Haddad", grade: "Grade 8" },
  { id: "omar", name: "Omar Saleh", grade: "Grade 7" },
  { id: "huda", name: "Huda Nasser", grade: "Grade 8" },
];

export type AccessMode = "closed" | "open" | "scheduled" | "timer";

// Who can view a folder, and when. It covers everything inside the folder,
// except subfolders that have their own rule. Students only ever get view
// access; they can't upload, change or download anything.
export type AccessRule = {
  mode: AccessMode;
  students: "all" | string[];
  // scheduled: when the window opens. timer: earliest start (null = now).
  opensAt: number | null;
  // scheduled: how long the window stays open.
  // timer: how long each student has after pressing Start.
  minutes: number;
  // timer: last moment a student can start (null = no limit).
  startBy: number | null;
};

// Folder id → its rule.
export type AccessRules = Record<string, AccessRule>;

// When each student started a timed folder, keyed by startKey().
export type Starts = Record<string, number>;

export function startKey(folderId: string, studentId: string) {
  return `${folderId}:${studentId}`;
}

export type AccessState =
  | { kind: "hidden" }
  | { kind: "upcoming"; opensAt: number }
  // A timer the student hasn't started yet.
  | { kind: "ready"; minutes: number; startBy: number | null }
  | { kind: "open"; endsAt: number | null };

const MINUTE = 60_000;

export function accessState(
  rule: AccessRule,
  folderId: string,
  studentId: string,
  starts: Starts,
  now: number,
): AccessState {
  const included = rule.students === "all" || rule.students.includes(studentId);
  if (!included || rule.mode === "closed") return { kind: "hidden" };
  if (rule.mode === "open") return { kind: "open", endsAt: null };

  if (rule.mode === "scheduled") {
    const opensAt = rule.opensAt ?? 0;
    const endsAt = opensAt + rule.minutes * MINUTE;
    if (now < opensAt) return { kind: "upcoming", opensAt };
    return now < endsAt ? { kind: "open", endsAt } : { kind: "hidden" };
  }

  const started = starts[startKey(folderId, studentId)];
  if (started !== undefined) {
    const endsAt = started + rule.minutes * MINUTE;
    return now < endsAt ? { kind: "open", endsAt } : { kind: "hidden" };
  }
  if (rule.opensAt && now < rule.opensAt)
    return { kind: "upcoming", opensAt: rule.opensAt };
  if (rule.startBy && now > rule.startBy) return { kind: "hidden" };
  return { kind: "ready", minutes: rule.minutes, startBy: rule.startBy };
}

// The folder whose rule applies to an item: the item itself (for a folder)
// or the nearest parent folder that has a rule.
export function ruleFolderId(
  items: SpaceItem[],
  item: SpaceItem,
  rules: AccessRules,
) {
  let id = item.kind === "folder" ? item.id : item.parentId;
  while (id) {
    if (rules[id]) return id;
    const parentId = id;
    id = items.find((i) => i.id === parentId)?.parentId ?? null;
  }
  return null;
}

// ----- Labels -----

export function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatWhen(time: number) {
  return new Date(time).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// 1:05:09 or 5:09.
export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export function studentsLabel(rule: AccessRule) {
  if (rule.students === "all") return "All students";
  const n = rule.students.length;
  return n === 1
    ? (students.find((s) => s.id === rule.students[0])?.name ?? "1 student")
    : `${n} students`;
}

// Short summary for the teacher, e.g. "Tue, Oct 15, 9:00 AM · 2h".
export function ruleSummary(rule: AccessRule) {
  switch (rule.mode) {
    case "closed":
      return "Closed";
    case "open":
      return "Open";
    case "scheduled":
      return `${formatWhen(rule.opensAt ?? 0)} · ${formatMinutes(rule.minutes)}`;
    case "timer":
      return `${formatMinutes(rule.minutes)} timer`;
  }
}
