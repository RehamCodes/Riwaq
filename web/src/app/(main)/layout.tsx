import Sidebar from "@/components/sidebar/Sidebar";
import Header from "@/components/header/Header";
import BottomNav from "@/components/sidebar/BottomNav";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    // App shell: the page itself never scrolls, only <main> does,
    // so the sidebar and top bar stay fixed in place.
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="p-3 pb-6 md:pl-0">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto px-3 pb-24 md:pb-3 md:pl-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
