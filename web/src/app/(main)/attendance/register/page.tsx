import type { Metadata } from "next";
import AttendanceRegister from "@/components/attendance/AttendanceRegister";

export const metadata: Metadata = {
  title: "Attendance register",
};

export default function AttendanceRegisterPage() {
  return <AttendanceRegister />;
}
