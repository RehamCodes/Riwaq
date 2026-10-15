import Link from "next/link";
import { CalendarDays, ClipboardList } from "lucide-react";
import CardTitle from "@/components/attendance/CardTitle";
import { upcomingTests } from "./dashboard-data";

export default function UpcomingTests() {
  const testCount = upcomingTests.filter((day) => day.subject).length;

  return (
    <section className="rounded-2xl bg-white p-5">
      <div className="flex items-center gap-3">
        <CardTitle icon={ClipboardList}>Upcoming Tests</CardTitle>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
          <span className="size-1.5 rounded-full bg-brand" />
          Test day
        </span>
        <Link
          href="/exams"
          aria-label="Open exams"
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <CalendarDays className="size-4" />
        </Link>
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-2">
        {upcomingTests.map(({ date, weekday, subject }) => (
          <li
            key={date}
            className={`flex aspect-square flex-col rounded-xl p-3 ${
              subject ? "bg-brand text-white" : "bg-slate-100 text-slate-800"
            }`}
          >
            <span className="text-2xl font-medium">{date}</span>
            {subject && <span className="text-sm">{subject}</span>}
            <span
              className={`mt-auto text-xs ${subject ? "text-brand-muted" : "text-slate-500"}`}
            >
              {weekday}
            </span>
          </li>
        ))}
        <li className="flex aspect-square flex-col justify-center rounded-xl bg-gold-soft p-3 text-slate-800">
          <span className="text-2xl font-medium">{testCount}</span>
          <span className="text-xs text-slate-600">
            {testCount === 1 ? "test" : "tests"} this week
          </span>
        </li>
      </ul>
    </section>
  );
}
