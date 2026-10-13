import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses",
};

export default function CoursesPage() {
  return <h1 className="text-2xl font-semibold text-slate-700">Courses</h1>;
}
