import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Students",
};

export default function StudentsPage() {
  return <h1 className="text-2xl font-semibold text-slate-700">Students</h1>;
}
