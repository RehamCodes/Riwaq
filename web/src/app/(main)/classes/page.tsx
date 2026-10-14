import type { Metadata } from "next";
import ClassCalendar from "@/components/calendar/ClassCalendar";

export const metadata: Metadata = {
  title: "Classes",
};

export default function ClassesPage() {
  return <ClassCalendar />;
}
