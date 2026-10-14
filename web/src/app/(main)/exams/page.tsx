import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exams",
};

export default function ExamsPage() {
  return <h1 className="text-2xl font-semibold text-slate-700">Exams</h1>;
}
