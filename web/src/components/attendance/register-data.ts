import { toDateInputValue, WORK_DAYS } from "@/components/calendar/date-utils";

// Sample class list and records until attendance comes from the server.

export type Status = "present" | "late" | "absent" | "excused";

export const statuses: Status[] = ["present", "late", "absent", "excused"];

export type RegisterStudent = { id: string; name: string; className: string };

export const classes = ["7A", "7B", "8A", "8B"];

const firstNames = [
  "Yousef",
  "Mariam",
  "Lina",
  "Omar",
  "Huda",
  "Ahmad",
  "Sara",
  "Rami",
  "Noor",
  "Zaid",
  "Layla",
  "Faris",
  "Dana",
  "Tariq",
  "Rania",
];
const lastNames = ["Ali", "Haddad", "Saleh", "Nasser"];

// 60 students, spread over the classes.
const names = lastNames.flatMap((last) =>
  firstNames.map((first) => `${first} ${last}`),
);

export const roster: RegisterStudent[] = names.map((name, i) => ({
  id: `s${i + 1}`,
  name,
  className: classes[i % classes.length],
}));

export function isSchoolDay(date: Date) {
  return WORK_DAYS.includes(date.getDay());
}

// Stable pseudo-random number 0–99 for a student and day, so the sample
// register looks the same on every visit.
function roll(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 100;
}

export type AttendanceRecord = { status: Status; arrival: string | null };

// The record for a school day up to today; null when nothing was taken
// (a future day or a weekend).
export function recordFor(
  student: RegisterStudent,
  date: Date,
  today: Date,
): AttendanceRecord | null {
  if (!isSchoolDay(date) || date > today) return null;
  const n = roll(`${student.id}:${toDateInputValue(date)}`);
  const minute = roll(`${student.id}:${toDateInputValue(date)}:t`);
  if (n < 84)
    return {
      status: "present",
      arrival: `7:${String(10 + (minute % 20)).padStart(2, "0")} AM`,
    };
  if (n < 91)
    return {
      status: "late",
      arrival: `7:${String(35 + (minute % 25)).padStart(2, "0")} AM`,
    };
  if (n < 96) return { status: "absent", arrival: null };
  return { status: "excused", arrival: null };
}
