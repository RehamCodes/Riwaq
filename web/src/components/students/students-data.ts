import {
  classes,
  students as roster,
} from "@/components/attendance/register-data";
import {
  pad,
  pick,
  samplePhone,
  schools,
  type Gender,
} from "@/components/directory/directory-data";

// Sample student records until students come from the server. Built on the
// attendance roster so ids, names and classes match across pages.

export type EnrollmentStatus = "active" | "transferred" | "withdrawn";
export type Transport = "bus" | "private";

export type Student = {
  id: string;
  code: string;
  name: string;
  gender: Gender;
  className: string;
  school: string;
  birthDate: string; // yyyy-mm-dd
  guardian: string;
  phone: string;
  enrolled: string; // yyyy-mm-dd
  status: EnrollmentStatus;
  transport: Transport;
};

export { classes };

export const enrollmentStatuses: EnrollmentStatus[] = [
  "active",
  "transferred",
  "withdrawn",
];
export const transports: Transport[] = ["bus", "private"];

const femaleNames = new Set([
  "Mariam",
  "Lina",
  "Huda",
  "Sara",
  "Noor",
  "Layla",
  "Dana",
  "Rania",
]);

const guardianFirstNames = [
  "Mahmoud",
  "Khaled",
  "Ibrahim",
  "Hasan",
  "Mustafa",
  "Jamal",
  "Walid",
];

export const studentRecords: Student[] = roster.map((s, i) => {
  const [first, last] = s.name.split(" ");
  // Grade 7 students are born in 2013, grade 8 in 2012.
  const birthYear = s.group.startsWith("7") ? 2013 : 2012;
  const enrolledYear = 2019 + pick(`${s.id}:enrolled`, 6);
  const status = pick(`${s.id}:status`, 100);
  return {
    id: s.id,
    code: `STU-${String(1001 + i)}`,
    name: s.name,
    gender: femaleNames.has(first) ? "female" : "male",
    className: s.group,
    school: schools[pick(`${s.id}:school`, schools.length)],
    birthDate: `${birthYear}-${pad(1 + pick(`${s.id}:m`, 12))}-${pad(1 + pick(`${s.id}:d`, 28))}`,
    guardian: `${guardianFirstNames[pick(`${s.id}:g`, guardianFirstNames.length)]} ${last}`,
    phone: samplePhone(s.id),
    enrolled: `${enrolledYear}-09-${pad(1 + pick(`${s.id}:e`, 10))}`,
    status: status < 88 ? "active" : status < 95 ? "transferred" : "withdrawn",
    transport: pick(`${s.id}:t`, 100) < 60 ? "bus" : "private",
  };
});

// Whole years between a yyyy-mm-dd birth date and today.
export function ageOn(birthDate: string, today: Date) {
  const [y, m, d] = birthDate.split("-").map(Number);
  let age = today.getFullYear() - y;
  if (
    today.getMonth() + 1 < m ||
    (today.getMonth() + 1 === m && today.getDate() < d)
  )
    age--;
  return age;
}
