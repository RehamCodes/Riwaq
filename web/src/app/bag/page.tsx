import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bag",
};

export default function BagPage() {
  return <h1 className="text-2xl font-semibold text-slate-700">Bag</h1>;
}
