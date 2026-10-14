"use client";

import { useState } from "react";
import { CalendarClock, Eye, Lock, RotateCcw, Timer } from "lucide-react";
import {
  Button,
  Checkbox,
  DateInput,
  Input,
  Modal,
  ModalHeader,
  TimeInput,
} from "@/components/ui";
import type { FolderItem } from "@/components/space/types";
import {
  formatCountdown,
  startKey,
  students,
  type AccessMode,
  type AccessRule,
  type Starts,
} from "./access";

const modes: {
  value: AccessMode;
  label: string;
  hint: string;
  icon: typeof Lock;
}[] = [
  {
    value: "closed",
    label: "Closed",
    hint: "Students can't see it",
    icon: Lock,
  },
  {
    value: "open",
    label: "Open",
    hint: "View any time",
    icon: Eye,
  },
  {
    value: "scheduled",
    label: "Scheduled",
    hint: "Opens and closes at set times",
    icon: CalendarClock,
  },
  {
    value: "timer",
    label: "Timer",
    hint: "Each student starts their own time",
    icon: Timer,
  },
];

const pad = (n: number) => String(n).padStart(2, "0");

function dateValue(time: number | null) {
  if (time === null) return "";
  const d = new Date(time);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function timeValue(time: number | null) {
  if (time === null) return "";
  const d = new Date(time);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Local date and time inputs → timestamp; null when the date is empty.
function toTime(date: string, time: string) {
  if (!date) return null;
  const value = new Date(`${date}T${time || "00:00"}`).getTime();
  return Number.isNaN(value) ? null : value;
}

export default function AccessDialog({
  folder,
  rule,
  starts,
  now,
  onSave,
  onResetStart,
  onClose,
}: {
  folder: FolderItem;
  rule: AccessRule | undefined;
  starts: Starts;
  now: number;
  onSave: (rule: AccessRule) => void;
  onResetStart: (studentId: string) => void;
  onClose: () => void;
}) {
  // A new schedule defaults to the next full hour.
  const nextHour = Math.ceil(now / 3_600_000) * 3_600_000;
  const opensAt = rule?.opensAt ?? (rule?.mode === "timer" ? null : nextHour);
  const minutes = rule?.minutes ?? 120;

  const [mode, setMode] = useState<AccessMode>(rule?.mode ?? "closed");
  const [everyone, setEveryone] = useState(
    rule?.students !== undefined ? rule.students === "all" : true,
  );
  const [picked, setPicked] = useState<string[]>(
    Array.isArray(rule?.students) ? rule.students : [],
  );
  const [openDate, setOpenDate] = useState(dateValue(opensAt));
  const [openTime, setOpenTime] = useState(timeValue(opensAt));
  const [hours, setHours] = useState(String(Math.floor(minutes / 60)));
  const [mins, setMins] = useState(String(minutes % 60));
  const [byDate, setByDate] = useState(dateValue(rule?.startBy ?? null));
  const [byTime, setByTime] = useState(timeValue(rule?.startBy ?? null));
  const [error, setError] = useState<string | null>(null);

  const timed = mode === "scheduled" || mode === "timer";
  const started = students.filter(
    (s) => starts[startKey(folder.id, s.id)] !== undefined,
  );

  function save(e: React.FormEvent) {
    e.preventDefault();
    const total = (Number(hours) || 0) * 60 + (Number(mins) || 0);
    const from = toTime(openDate, openTime);
    const by = toTime(byDate, byTime || "23:59");
    if (!everyone && picked.length === 0)
      return setError("Choose at least one student.");
    if (timed && total <= 0) return setError("Set how long it stays open.");
    if (mode === "scheduled" && from === null)
      return setError("Choose when it opens.");
    if (mode === "timer" && from !== null && by !== null && by <= from)
      return setError("The start deadline must be after it opens.");
    onSave({
      mode,
      students: everyone ? "all" : picked,
      opensAt: timed ? from : null,
      minutes: timed ? total : minutes,
      startBy: mode === "timer" ? by : null,
    });
  }

  const label = "text-xs font-medium text-slate-500";

  return (
    <Modal
      label="Access settings"
      onClose={onClose}
      className="max-h-[90dvh] overflow-y-auto"
    >
      <ModalHeader title={`Access · ${folder.name}`} onClose={onClose} />
      <p className="mt-1 text-slate-500">
        Students can only view what&apos;s in this folder — they can&apos;t
        download, upload or change anything.
      </p>

      <form className="mt-4 flex flex-col gap-5" onSubmit={save}>
        <fieldset className="flex flex-col gap-2">
          <legend className={`${label} mb-2`}>Who can view it</legend>
          <div className="flex rounded-lg bg-brand-soft p-0.5">
            {[
              [true, "All students"],
              [false, "Selected students"],
            ].map(([value, text]) => (
              <button
                key={String(value)}
                type="button"
                aria-pressed={everyone === value}
                onClick={() => setEveryone(value as boolean)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm ${
                  everyone === value
                    ? "bg-white font-medium text-brand shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {text}
              </button>
            ))}
          </div>
          {!everyone && (
            <div className="flex flex-col gap-1.5 rounded-lg border border-slate-200 p-3">
              {students.map((s) => (
                <Checkbox
                  key={s.id}
                  checked={picked.includes(s.id)}
                  onChange={(e) =>
                    setPicked((list) =>
                      e.target.checked
                        ? [...list, s.id]
                        : list.filter((id) => id !== s.id),
                    )
                  }
                  label={
                    <>
                      {s.name}
                      <span className="text-xs text-slate-400">{s.grade}</span>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className={`${label} mb-2`}>When</legend>
          <div className="grid grid-cols-2 gap-2">
            {modes.map(({ value, label, hint, icon: Icon }) => (
              <label
                key={value}
                className={`flex cursor-pointer gap-2 rounded-lg border p-2.5 ${
                  mode === value
                    ? "border-brand bg-brand-soft ring-1 ring-brand"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value={value}
                  checked={mode === value}
                  onChange={() => setMode(value)}
                  className="sr-only"
                />
                <Icon className="mt-0.5 size-4 shrink-0 text-slate-500" />
                <span>
                  <span className="block font-medium text-slate-800">
                    {label}
                  </span>
                  <span className="block text-xs text-slate-500">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {timed && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className={label}>
                {mode === "scheduled"
                  ? "Opens at"
                  : "Available from (leave empty for now)"}
              </span>
              <div className="flex gap-2">
                <DateInput
                  value={openDate}
                  onChange={(e) => setOpenDate(e.target.value)}
                  aria-label="Opening date"
                />
                <TimeInput
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  aria-label="Opening time"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={label}>
                {mode === "scheduled"
                  ? "Stays open for"
                  : "Time each student gets after pressing Start"}
              </span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  aria-label="Hours"
                  className="w-20"
                />
                <span className="text-slate-500">h</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={mins}
                  onChange={(e) => setMins(e.target.value)}
                  aria-label="Minutes"
                  className="w-20"
                />
                <span className="text-slate-500">min</span>
              </div>
            </div>

            {mode === "timer" && (
              <div className="flex flex-col gap-1.5">
                <span className={label}>
                  Must start by (leave empty for no limit)
                </span>
                <div className="flex gap-2">
                  <DateInput
                    value={byDate}
                    onChange={(e) => setByDate(e.target.value)}
                    aria-label="Start deadline date"
                  />
                  <TimeInput
                    value={byTime}
                    onChange={(e) => setByTime(e.target.value)}
                    aria-label="Start deadline time"
                  />
                </div>
              </div>
            )}

            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              When the time is up, students lose access and anything they have
              open is closed.
            </p>
          </div>
        )}

        {mode === "timer" && started.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className={label}>Started</span>
            <ul className="flex flex-col divide-y divide-slate-100 rounded-lg border border-slate-200">
              {started.map((s) => {
                const left =
                  starts[startKey(folder.id, s.id)] + minutes * 60_000 - now;
                return (
                  <li
                    key={s.id}
                    className="flex items-center gap-2 px-3 py-1.5"
                  >
                    <span className="flex-1">{s.name}</span>
                    <span className="text-xs text-slate-500 tabular-nums">
                      {left > 0 ? `${formatCountdown(left)} left` : "Finished"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onResetStart(s.id)}
                      title="Let this student start again"
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100"
                    >
                      <RotateCcw className="size-3" />
                      Reset
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {error && (
          <p role="alert" className="text-rose-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}
