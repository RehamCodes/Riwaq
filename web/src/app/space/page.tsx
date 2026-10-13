import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Space",
};

export default function SpacePage() {
  return <h1 className="text-2xl font-semibold text-slate-700">Space</h1>;
}
