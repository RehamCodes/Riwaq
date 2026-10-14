import type { Metadata } from "next";
import ExamsFinder from "@/components/exams/ExamsFinder";

export const metadata: Metadata = {
  title: "Exams",
};

export default function ExamsPage() {
  return <ExamsFinder />;
}
