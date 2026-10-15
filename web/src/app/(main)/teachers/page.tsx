import type { Metadata } from "next";
import TeachersSheet from "@/components/teachers/TeachersSheet";

export const metadata: Metadata = {
  title: "Teachers",
};

export default function TeachersPage() {
  return <TeachersSheet />;
}
