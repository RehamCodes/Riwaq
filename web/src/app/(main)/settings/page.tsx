import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return <h1 className="text-2xl font-semibold text-slate-700">Settings</h1>;
}
