import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teachers",
};

export default function TeachersPage() {
  return <h1 className="text-2xl font-semibold text-slate-700">Teachers</h1>;
}
