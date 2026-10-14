import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Certificates",
};

export default function CertificatesPage() {
  return (
    <h1 className="text-2xl font-semibold text-slate-700">Certificates</h1>
  );
}
