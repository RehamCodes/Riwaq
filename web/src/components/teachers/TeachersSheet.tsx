"use client";

import {
  Chip,
  DataSheet,
  PhoneLink,
  type SheetColumn,
  type SheetFilter,
} from "@/components/directory/DataSheet";
import {
  capitalize,
  formatDate,
  genders,
  schools,
} from "@/components/directory/directory-data";
import {
  classes,
  employments,
  qualifications,
  staffStatuses,
  subjects,
  teacherRecords,
  type Qualification,
  type StaffStatus,
  type Teacher,
} from "./teachers-data";

const statusChip: Record<StaffStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  "on-leave": "bg-amber-50 text-amber-800",
  resigned: "bg-rose-50 text-rose-700",
};

const statusLabel: Record<StaffStatus, string> = {
  active: "Active",
  "on-leave": "On leave",
  resigned: "Resigned",
};

const qualificationLabel: Record<Qualification, string> = {
  bachelor: "Bachelor's",
  master: "Master's",
  phd: "PhD",
};

const filters: SheetFilter<Teacher>[] = [
  {
    key: "school",
    label: "School",
    all: "All schools",
    options: schools.map((s) => ({ value: s, label: s })),
    value: (t) => t.school,
  },
  {
    key: "subject",
    label: "Subject",
    all: "All subjects",
    options: subjects.map((s) => ({ value: s, label: s })),
    value: (t) => t.subject,
  },
  {
    key: "class",
    label: "Class",
    all: "All classes",
    options: classes.map((c) => ({ value: c, label: `Class ${c}` })),
    value: (t) => t.classes,
  },
  {
    key: "gender",
    label: "Gender",
    all: "All genders",
    options: genders.map((g) => ({ value: g, label: capitalize(g) })),
    value: (t) => t.gender,
  },
  {
    key: "employment",
    label: "Employment",
    all: "All employment",
    options: employments.map((e) => ({ value: e, label: capitalize(e) })),
    value: (t) => t.employment,
  },
  {
    key: "qualification",
    label: "Qualification",
    all: "All qualifications",
    options: qualifications.map((q) => ({
      value: q,
      label: qualificationLabel[q],
    })),
    value: (t) => t.qualification,
  },
  {
    key: "status",
    label: "Status",
    all: "All statuses",
    options: staffStatuses.map((s) => ({ value: s, label: statusLabel[s] })),
    value: (t) => t.status,
  },
];

const columns: SheetColumn<Teacher>[] = [
  {
    key: "code",
    label: "ID",
    value: (t) => t.code,
    className: "text-slate-400 tabular-nums",
  },
  { key: "name", label: "Name", value: (t) => t.name },
  { key: "gender", label: "Gender", value: (t) => capitalize(t.gender) },
  { key: "subject", label: "Subject", value: (t) => t.subject },
  { key: "classes", label: "Classes", value: (t) => t.classes.join(", ") },
  { key: "school", label: "School", value: (t) => t.school },
  {
    key: "qualification",
    label: "Qualification",
    value: (t) => qualificationLabel[t.qualification],
  },
  {
    key: "experience",
    label: "Experience",
    // Padded so the text sort orders numbers correctly.
    value: (t) => String(t.experience).padStart(2, "0"),
    render: (t) => `${t.experience} yrs`,
    className: "text-slate-600 tabular-nums",
  },
  {
    key: "email",
    label: "Email",
    value: (t) => t.email,
    render: (t) => (
      <a href={`mailto:${t.email}`} className="hover:text-brand">
        {t.email}
      </a>
    ),
    className: "text-slate-500",
  },
  {
    key: "phone",
    label: "Phone",
    value: (t) => t.phone,
    render: (t) => <PhoneLink phone={t.phone} />,
    className: "text-slate-500 tabular-nums",
  },
  {
    key: "hired",
    label: "Hired",
    value: (t) => t.hired,
    render: (t) => formatDate(t.hired),
    className: "text-slate-500 tabular-nums",
  },
  {
    key: "employment",
    label: "Employment",
    value: (t) => capitalize(t.employment),
  },
  {
    key: "status",
    label: "Status",
    value: (t) => statusLabel[t.status],
    render: (t) => (
      <Chip className={statusChip[t.status]}>{statusLabel[t.status]}</Chip>
    ),
  },
];

export default function TeachersSheet() {
  return (
    <DataSheet
      title="Teachers"
      noun="teachers"
      rows={teacherRecords}
      columns={columns}
      filters={filters}
      search={(t) => [t.name, t.code, t.email, t.phone]}
      searchPlaceholder="Search name, ID, email…"
      defaultSort="name"
      stickyColumn="name"
      fileName="teachers.csv"
    />
  );
}
