import type { Metadata } from "next";
import AverageGpa from "@/components/dashboard/AverageGpa";
import GradeSummary from "@/components/dashboard/GradeSummary";
import ParentContacts from "@/components/dashboard/ParentContacts";
import RecentEvents from "@/components/dashboard/RecentEvents";
import SchoolInfoBar from "@/components/dashboard/SchoolInfoBar";
import TodaySchedule from "@/components/dashboard/TodaySchedule";
import UpcomingTests from "@/components/dashboard/UpcomingTests";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <SchoolInfoBar />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
        <div className="grid xl:col-span-4">
          <GradeSummary />
        </div>
        <div className="grid md:col-span-2 xl:col-span-5">
          <AverageGpa />
        </div>
        <div className="grid xl:col-span-3">
          <ParentContacts />
        </div>
        <div className="grid xl:col-span-4">
          <UpcomingTests />
        </div>
        <div className="grid xl:col-span-4">
          <TodaySchedule />
        </div>
        <div className="grid md:col-span-2 xl:col-span-4">
          <RecentEvents />
        </div>
      </div>
    </div>
  );
}
