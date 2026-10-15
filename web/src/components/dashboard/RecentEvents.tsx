"use client";

import { useState } from "react";
import { CalendarCheck, Megaphone, Plus } from "lucide-react";
import Avatar from "@/components/presence/Avatar";
import CardTitle from "@/components/attendance/CardTitle";
import { recentEvents } from "./dashboard-data";

export default function RecentEvents() {
  const [added, setAdded] = useState<Set<string>>(new Set());

  function toggle(title: string) {
    setAdded((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  return (
    <section className="rounded-2xl bg-white p-5">
      <div className="flex items-center gap-3">
        <CardTitle icon={Megaphone}>Recent Events</CardTitle>
        <button
          type="button"
          className="ml-auto rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand hover:bg-brand-muted/50"
        >
          Show all
        </button>
      </div>

      {recentEvents.map((event) => {
        const isAdded = added.has(event.title);
        return (
          <article
            key={event.title}
            className="mt-4 rounded-xl border border-slate-200 p-4"
          >
            <header className="flex items-center gap-3">
              <Avatar name={event.author} size="md" className="bg-brand" />
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {event.author}
                </p>
                <p className="text-xs text-slate-500">{event.role}</p>
              </div>
            </header>

            <div className="mt-3 rounded-lg bg-paper p-3">
              <h3 className="text-sm font-medium text-slate-800">
                {event.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                {event.body}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {event.reactions.map(({ emoji, count }) => (
                <span
                  key={emoji}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {emoji} {count}
                </span>
              ))}
              <span className="ml-auto text-xs text-slate-500">
                {event.date}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex -space-x-2">
                {event.commenters.map((name) => (
                  <span key={name} className="rounded-full ring-2 ring-white">
                    <Avatar name={name} size="xs" className="bg-slate-600" />
                  </span>
                ))}
              </div>
              <span className="text-xs text-slate-600">
                {event.comments} comments
              </span>
              <button
                type="button"
                aria-pressed={isAdded}
                onClick={() => toggle(event.title)}
                className={`ml-auto flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isAdded
                    ? "bg-brand text-white hover:bg-brand-hover"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {isAdded ? (
                  <CalendarCheck className="size-3.5" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                {isAdded ? "Added" : "Add to calendar"}
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
