"use client";

import { useNow } from "@/components/calendar/use-now";
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
  ageOn,
  classes,
  enrollmentStatuses,
  studentRecords,
  transports,
  type EnrollmentStatus,
  type Student,
} from "./students-data";

const statusChip: Record<EnrollmentStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  transferred: "bg-amber-50 text-amber-800",
  withdrawn: "bg-rose-50 text-rose-700",
};

const transportLabel = (t: Student["transport"]) =>
  t === "bus" ? "School bus" : "Private";

const filters: SheetFilter<Student>[] = [
  {
    key: "school",
    label: "School",
    all: "All schools",
    options: schools.map((s) => ({ value: s, label: s })),
    value: (s) => s.school,
  },
  {
    key: "className",
    label: "Class",
    all: "All classes",
    options: classes.map((c) => ({ value: c, label: `Class ${c}` })),
    value: (s) => s.className,
  },
  {
    key: "gender",
    label: "Gender",
    all: "All genders",
    options: genders.map((g) => ({ value: g, label: capitalize(g) })),
    value: (s) => s.gender,
  },
  {
    key: "status",
    label: "Status",
    all: "All statuses",
    options: enrollmentStatuses.map((s) => ({
      value: s,
      label: capitalize(s),
    })),
    value: (s) => s.status,
  },
  {
    key: "transport",
    label: "Transport",
    all: "All transport",
    options: transports.map((t) => ({ value: t, label: transportLabel(t) })),
    value: (s) => s.transport,
  },
];

export default function StudentsSheet() {
  const now = useNow();

  const columns: SheetColumn<Student>[] = [
    {
      key: "code",
      label: "ID",
      value: (s) => s.code,
      className: "text-slate-400 tabular-nums",
    },
    { key: "name", label: "Name", value: (s) => s.name },
    { key: "gender", label: "Gender", value: (s) => capitalize(s.gender) },
    { key: "className", label: "Class", value: (s) => s.className },
    { key: "school", label: "School", value: (s) => s.school },
    {
      key: "birthDate",
      label: "Date of birth",
      // Sorting by the ISO date puts older students first.
      value: (s) => s.birthDate,
      render: (s) => (
        <>
          {formatDate(s.birthDate)}
          {now && (
            <span className="ml-1.5 text-xs text-slate-400">
              ({ageOn(s.birthDate, now)} y)
            </span>
          )}
        </>
      ),
      className: "text-slate-600 tabular-nums",
    },
    { key: "guardian", label: "Guardian", value: (s) => s.guardian },
    {
      key: "phone",
      label: "Phone",
      value: (s) => s.phone,
      render: (s) => <PhoneLink phone={s.phone} />,
      className: "text-slate-500 tabular-nums",
    },
    {
      key: "transport",
      label: "Transport",
      value: (s) => transportLabel(s.transport),
    },
    {
      key: "enrolled",
      label: "Enrolled",
      value: (s) => s.enrolled,
      render: (s) => formatDate(s.enrolled),
      className: "text-slate-500 tabular-nums",
    },
    {
      key: "status",
      label: "Status",
      value: (s) => capitalize(s.status),
      render: (s) => (
        <Chip className={statusChip[s.status]}>{capitalize(s.status)}</Chip>
      ),
    },
  ];

  return (
    <DataSheet
      title="Students"
      noun="students"
      rows={studentRecords}
      columns={columns}
      filters={filters}
      search={(s) => [s.name, s.code, s.guardian, s.phone]}
      searchPlaceholder="Search name, ID, guardian…"
      defaultSort="name"
      stickyColumn="name"
      fileName="students.csv"
    />
  );
}
