import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  GraduationCap,
  Presentation,
  Star,
  Trophy,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { initialsOf } from "@/components/presence/Avatar";
import AttendanceStatistics from "./AttendanceStatistics";
import CardTitle from "./CardTitle";
import { smoothPath } from "./smooth-path";
import {
  ACCENT,
  ACCENT_ALT,
  formatCount,
  formatMoney,
  summary,
  topTeachers,
} from "./attendance-data";

const card = "rounded-2xl bg-white p-5";
const accentButton =
  "flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover";

export default function AttendanceDashboard() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
      <TotalAttendance
        title="Student Attendance"
        icon={GraduationCap}
        value={summary.attendance.students}
        href="/attendance/register"
      />
      <TotalAttendance
        title="Teacher Attendance"
        icon={Presentation}
        value={summary.attendance.teachers}
        href="/attendance/teachers"
        color={ACCENT_ALT}
      />
      <StatCard
        title="Total Teachers"
        icon={Presentation}
        value={summary.teachers.total}
        change={summary.teachers.change}
        note="Teaching across all grades this term"
        trend={summary.teachers.trend}
        href="/teachers"
      />
      <StatCard
        title="Total Students"
        icon={GraduationCap}
        value={summary.students.total}
        change={summary.students.change}
        note="Enrolled students this term"
        trend={summary.students.trend}
        href="/attendance/register"
      />

      <div className="flex flex-col gap-4 md:col-span-2 xl:col-span-7">
        <AttendanceStatistics />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MiniTile
            icon={ArrowDownToLine}
            label="Total Arrival Attendance"
            value={summary.arrivals}
            href="/attendance/register"
          />
          <MiniTile
            icon={ArrowUpFromLine}
            label="Total Return Attendance"
            value={summary.returns}
            href="/attendance/register"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 md:col-span-2 xl:col-span-5">
        <SchoolEarning />
        <TopRatedTeachers />
      </div>
    </div>
  );
}

function TotalAttendance({
  title,
  icon: Icon,
  value,
  href,
  color = ACCENT,
}: {
  title: string;
  icon: LucideIcon;
  value: number;
  href: string;
  color?: string;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl p-6 text-white xl:col-span-3"
      style={{ background: color }}
    >
      {/* Decorative rings centered on the top-right corner. */}
      <div aria-hidden="true" className="absolute top-0 right-0">
        {[320, 220, 120].map((size) => (
          <span
            key={size}
            className="absolute rounded-full border border-white/20"
            style={{
              width: size,
              height: size,
              top: -size / 2,
              left: -size / 2,
            }}
          />
        ))}
      </div>
      <div className="relative">
        <h2 className="flex items-center gap-2.5 font-semibold">
          <span
            className="flex size-7 items-center justify-center rounded-lg bg-white"
            style={{ color }}
          >
            <Icon className="size-4" />
          </span>
          {title}
        </h2>
        <p className="mt-6 text-4xl font-semibold tracking-tight">
          {formatCount(value)}
        </p>
        <p className="mt-2 text-sm text-white/85">
          This data obtained since
          <br />
          {summary.since}
        </p>
        <Link
          href={href}
          className="mt-6 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100"
          style={{ color }}
        >
          Check Details Now
        </Link>
      </div>
    </section>
  );
}

// Bars for the last few periods; the latest one is in the accent color.
function TrendBars({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(...values);
  return (
    <div
      role="img"
      aria-label={`${label}: ${values.map(formatCount).join(", ")}`}
      className="flex h-14 items-end gap-1.5"
    >
      {values.map((v, i) => (
        <span
          key={i}
          title={formatCount(v)}
          className="w-2 rounded-t-[4px]"
          style={{
            height: `${(v / max) * 100}%`,
            background: i === values.length - 1 ? ACCENT : "#c5d1e4",
          }}
        />
      ))}
    </div>
  );
}

function StatCard({
  title,
  icon,
  value,
  change,
  note,
  trend,
  href,
}: {
  title: string;
  icon: LucideIcon;
  value: number;
  change: string;
  note: string;
  trend: number[];
  href: string;
}) {
  return (
    <section className={`${card} flex flex-col xl:col-span-3`}>
      <CardTitle icon={icon}>{title}</CardTitle>
      <div className="mt-5 flex items-center gap-3">
        <p className="text-4xl font-semibold tracking-tight text-slate-800">
          {formatCount(value)}
        </p>
        <span className="ml-auto rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
          {change}
        </span>
      </div>
      <div className="mt-4 mb-auto flex items-end gap-3">
        <TrendBars values={trend} label={`${title}, last 7 months`} />
        <p className="text-xs text-slate-400">{note}</p>
      </div>
      <Link href={href} className={`${accentButton} mt-5 w-full`}>
        Check Details
      </Link>
    </section>
  );
}

function SchoolEarning() {
  const values = summary.earning.trend;
  const w = 140;
  const h = 48;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const points = values.map(
    (v, i) =>
      [
        2 + (i * (w - 4)) / (values.length - 1),
        h - 4 - ((v - lo) / (hi - lo)) * (h - 8),
      ] as [number, number],
  );
  const [endX, endY] = points[points.length - 1];

  return (
    <section className={card}>
      <CardTitle icon={Wallet}>School Earning</CardTitle>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <p className="text-4xl font-semibold tracking-tight text-slate-800">
          {formatMoney(summary.earning.total)}
        </p>
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={`Earnings trend, last ${values.length} months`}
          className="overflow-visible"
        >
          <path
            d={smoothPath(points)}
            fill="none"
            stroke={ACCENT}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <circle
            cx={endX}
            cy={endY}
            r={4}
            fill={ACCENT}
            stroke="#fff"
            strokeWidth={2}
          />
        </svg>
        <p className="text-xs text-slate-500">
          <span className="font-medium text-emerald-600">
            {summary.earning.change}
          </span>{" "}
          compared to
          <br />
          last month
        </p>
      </div>
    </section>
  );
}

function TopRatedTeachers() {
  return (
    <section className={`${card} flex-1`}>
      <div className="flex items-center justify-between gap-3">
        <CardTitle icon={Trophy}>Top Rated Teacher</CardTitle>
        <Link
          href="/teachers"
          className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          View details
          <ChevronRight className="size-4" />
        </Link>
      </div>
      <ul className="mt-5 grid grid-cols-3 gap-3">
        {topTeachers.map((t) => (
          <li key={t.name} className="flex flex-col items-center text-center">
            <div className="relative w-full">
              <span
                className="flex aspect-square w-full items-center justify-center rounded-xl text-3xl font-semibold text-white"
                style={{ background: ACCENT }}
                aria-hidden="true"
              >
                {initialsOf(t.name)}
              </span>
              <span className="absolute -bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-xs font-medium text-slate-700 shadow">
                <Star className="size-3 fill-gold text-gold" />
                {t.rating}
                <span className="sr-only">out of 5</span>
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-800">
              {t.name}
            </p>
            <p className="text-xs font-medium text-brand">{t.subject}</p>
            <p className="mt-1 text-[11px] text-slate-400">{t.location}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MiniTile({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`${card} group flex items-center gap-4 transition-shadow hover:shadow-md`}
    >
      <span
        className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-white"
        style={{ background: ACCENT }}
      >
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-slate-500">{label}</span>
        <span className="block text-2xl font-semibold text-slate-800">
          {formatCount(value)}
        </span>
      </span>
      <ChevronRight className="size-5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
