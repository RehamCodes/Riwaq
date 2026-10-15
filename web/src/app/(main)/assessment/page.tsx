import type { Metadata } from "next";
import Gradebook from "@/components/assessment/Gradebook";

export const metadata: Metadata = {
  title: "Assessment",
};

export default function AssessmentPage() {
  return <Gradebook />;
}
