import type { Metadata } from "next";
import AttendanceRegister from "@/components/attendance/AttendanceRegister";

export const metadata: Metadata = {
  title: "Teacher attendance",
};

export default function TeacherAttendancePage() {
  return <AttendanceRegister kind="teachers" />;
}
