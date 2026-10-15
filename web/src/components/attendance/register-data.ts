import { toDateInputValue, WORK_DAYS } from "@/components/calendar/date-utils";

// Sample rosters and records until attendance comes from the server.

export type Status = "present" | "late" | "absent" | "excused";

export const statuses: Status[] = ["present", "late", "absent", "excused"];

// A person on a register; `group` is a student's class or a teacher's subject.
export type RegisterPerson = { id: string; name: string; group: string };

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

export const students: RegisterPerson[] = names.map((name, i) => ({
  id: `s${i + 1}`,
  name,
  group: classes[i % classes.length],
}));

export const subjects = [
  "Arabic",
  "English",
  "Mathematics",
  "Science",
  "Social Studies",
  "Islamic Studies",
];

const teacherNames = [
  "Ms. Huda Saleh",
  "Mr. Khaled Mansour",
  "Ms. Sara Nabil",
  "Mr. Fadi Odeh",
  "Ms. Rana Khalil",
  "Mr. Samer Jaber",
  "Ms. Lama Qasem",
  "Mr. Hani Darwish",
  "Ms. Dima Hamdan",
  "Mr. Majed Shami",
  "Ms. Abeer Zoubi",
  "Mr. Nabil Atieh",
  "Ms. Reem Barakat",
  "Mr. Waleed Nimri",
  "Ms. Suha Masri",
  "Mr. Bassam Rifai",
  "Ms. Nisreen Tal",
  "Mr. Ayman Khatib",
];

export const teachers: RegisterPerson[] = teacherNames.map((name, i) => ({
  id: `t${i + 1}`,
  name,
  group: subjects[i % subjects.length],
}));

export function isSchoolDay(date: Date) {
  return WORK_DAYS.includes(date.getDay());
}

// Stable pseudo-random number 0–99 for a person and day, so the sample
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
  person: RegisterPerson,
  date: Date,
  today: Date,
): AttendanceRecord | null {
  if (!isSchoolDay(date) || date > today) return null;
  const n = roll(`${person.id}:${toDateInputValue(date)}`);
  const minute = roll(`${person.id}:${toDateInputValue(date)}:t`);
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
