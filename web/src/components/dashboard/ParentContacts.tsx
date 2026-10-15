"use client";

import { useState } from "react";
import { Contact } from "lucide-react";
import Avatar from "@/components/presence/Avatar";
import CardTitle from "@/components/attendance/CardTitle";
import { parents } from "./dashboard-data";

const PREVIEW = 3;

export default function ParentContacts() {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? parents : parents.slice(0, PREVIEW);

  return (
    <section className="flex flex-col rounded-2xl bg-white p-5">
      <CardTitle icon={Contact}>Parents&apos; Contacts</CardTitle>
      <p className="mt-1 text-xs text-slate-500">
        Here you can see parents and their contacts.
      </p>

      <ul className="mt-4 flex flex-col gap-4">
        {shown.map(({ name, role, phone }) => (
          <li key={name} className="flex items-center gap-3">
            <Avatar name={name} size="md" className="bg-brand-light" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {name}
              </p>
              <p className="truncate text-xs text-slate-500">{role}</p>
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="text-xs whitespace-nowrap text-slate-700 hover:text-brand"
              >
                {phone}
              </a>
            </div>
          </li>
        ))}
      </ul>

      {parents.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 self-start rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand hover:bg-brand-muted/50"
        >
          {showAll ? "Show less" : "Show all"}
        </button>
      )}
    </section>
  );
}
