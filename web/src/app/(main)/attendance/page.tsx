import type { Metadata } from "next";
import AttendanceDashboard from "@/components/attendance/AttendanceDashboard";

export const metadata: Metadata = {
  title: "Attendance",
};

export default function AttendancePage() {
  return <AttendanceDashboard />;
}
