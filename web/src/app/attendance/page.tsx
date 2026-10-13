import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Attendance",
};

export default function AttendancePage() {
  return <h1 className="text-2xl font-semibold text-slate-700">Attendance</h1>;
}
