import type { Metadata } from "next";
import StudentsSheet from "@/components/students/StudentsSheet";

export const metadata: Metadata = {
  title: "Students",
};

export default function StudentsPage() {
  return <StudentsSheet />;
}
