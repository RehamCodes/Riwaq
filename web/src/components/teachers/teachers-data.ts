import {
  classes,
  subjects,
  teachers as roster,
} from "@/components/attendance/register-data";
import {
  pad,
  pick,
  samplePhone,
  schools,
  type Gender,
} from "@/components/directory/directory-data";

// Sample teacher records until teachers come from the server. Built on the
// attendance roster so ids, names and subjects match across pages.

export type Employment = "full-time" | "part-time";
export type Qualification = "bachelor" | "master" | "phd";
export type StaffStatus = "active" | "on-leave" | "resigned";

export type Teacher = {
  id: string;
  code: string;
  name: string;
  gender: Gender;
  subject: string;
  classes: string[];
  school: string;
  qualification: Qualification;
  experience: number; // years
  email: string;
  phone: string;
  hired: string; // yyyy-mm-dd
  employment: Employment;
  status: StaffStatus;
};

export { classes, subjects };

export const employments: Employment[] = ["full-time", "part-time"];
export const qualifications: Qualification[] = ["bachelor", "master", "phd"];
export const staffStatuses: StaffStatus[] = ["active", "on-leave", "resigned"];

export const teacherRecords: Teacher[] = roster.map((t, i) => {
  // "Ms. Huda Saleh" → title "Ms.", "huda.saleh".
  const [title, first, last] = t.name.split(" ");
  const hiredYear = 2010 + pick(`${t.id}:hired`, 15);
  const status = pick(`${t.id}:status`, 100);
  const qualification = pick(`${t.id}:q`, 100);
  // Each teacher takes two of the classes.
  const start = pick(`${t.id}:c`, classes.length);
  return {
    id: t.id,
    code: `TCH-${String(201 + i)}`,
    name: t.name,
    gender: title === "Ms." ? "female" : "male",
    subject: t.group,
    classes: [classes[start], classes[(start + 1) % classes.length]],
    school: schools[pick(`${t.id}:school`, schools.length)],
    qualification:
      qualification < 55 ? "bachelor" : qualification < 90 ? "master" : "phd",
    experience: 2026 - hiredYear + pick(`${t.id}:x`, 6),
    email: `${first}.${last}@riwaq.edu.jo`.toLowerCase(),
    phone: samplePhone(t.id),
    hired: `${hiredYear}-${pad(8 + pick(`${t.id}:m`, 2))}-${pad(1 + pick(`${t.id}:d`, 28))}`,
    employment: pick(`${t.id}:e`, 100) < 80 ? "full-time" : "part-time",
    status: status < 85 ? "active" : status < 95 ? "on-leave" : "resigned",
  };
});
