import { Clock } from "lucide-react";
import CardTitle from "@/components/attendance/CardTitle";
import { todaySchedule } from "./dashboard-data";

export default function TodaySchedule() {
  return (
    <section className="rounded-2xl bg-white p-5">
      <CardTitle icon={Clock}>Today&apos;s Schedule</CardTitle>
      <ol className="mt-3 divide-y divide-slate-100">
        {todaySchedule.map(({ start, end, title }) => (
          <li key={start} className="flex items-center gap-4 py-3 text-sm">
            <span className="text-xs whitespace-nowrap text-slate-500">
              {start} – {end}
            </span>
            <span className="ml-auto text-right font-medium text-slate-800">
              {title}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
