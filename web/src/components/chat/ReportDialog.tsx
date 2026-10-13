"use client";

import { useState } from "react";
import { Button, Checkbox, Modal, ModalHeader } from "@/components/ui";
import type { Contact, StudentReport } from "./chat-data";

const DETAILS_MAX = 1000;

const types: { value: StudentReport["type"]; label: string; hint: string }[] = [
  {
    value: "report",
    label: "Report",
    hint: "Log an incident or concern about the student.",
  },
  {
    value: "complaint",
    label: "Complaint",
    hint: "File a formal complaint for the school to follow up.",
  },
];

const categories = [
  "Behaviour",
  "Bullying",
  "Absence or lateness",
  "Homework or academics",
  "Bus or transport",
  "Other",
];

const field =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none";

export default function ReportDialog({
  student,
  onClose,
  onSubmit,
}: {
  student: Contact;
  onClose: () => void;
  onSubmit: (report: StudentReport) => void;
}) {
  const [type, setType] = useState<StudentReport["type"]>("report");
  const [details, setDetails] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    onSubmit({
      type,
      category: String(data.get("category")),
      details: details.trim(),
      notifyParent: data.get("notifyParent") === "on",
    });
  }

  const heading = `Report ${student.name}`;

  return (
    <Modal label={heading} onClose={onClose}>
      <ModalHeader title={heading} onClose={onClose} />

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <fieldset>
          <legend className="sr-only">Type</legend>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            {types.map((t) => (
              <label
                key={t.value}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-center font-medium has-focus-visible:outline-2 has-focus-visible:outline-slate-400 ${
                  type === t.value
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t.value}
                  checked={type === t.value}
                  onChange={() => setType(t.value)}
                  className="sr-only"
                />
                {t.label}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {types.find((t) => t.value === type)?.hint}
          </p>
        </fieldset>

        <select
          name="category"
          aria-label="Category"
          defaultValue={categories[0]}
          className={field}
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <div>
          <textarea
            required
            autoFocus
            rows={5}
            value={details}
            maxLength={DETAILS_MAX}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={
              type === "report"
                ? "What happened? Include the date, time and place."
                : "Describe the complaint and what you'd like to happen."
            }
            aria-label="Details"
            className={`${field} resize-none`}
          />
          <p className="text-right text-xs text-slate-400">
            {details.length}/{DETAILS_MAX}
          </p>
        </div>

        {student.parent && (
          <Checkbox
            name="notifyParent"
            label={`Notify parent (${student.parent.name})`}
          />
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!details.trim()}>
            Send {type}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
