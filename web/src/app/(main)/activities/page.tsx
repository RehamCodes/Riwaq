import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activities",
};

export default function ActivitiesPage() {
  return <h1 className="text-2xl font-semibold text-slate-700">Activities</h1>;
}
