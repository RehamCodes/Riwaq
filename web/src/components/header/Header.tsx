import { Search } from "lucide-react";
import ProfileMenu from "./ProfileMenu";

export default function Header({ userName = "User" }: { userName?: string }) {
  return (
    <header className="relative z-10 flex items-center gap-4 rounded-2xl bg-white px-4 py-3 md:gap-6 md:px-6 md:py-4">
      <form role="search" className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
          strokeWidth={1.75}
        />
        <input
          type="search"
          name="q"
          placeholder="Search for students/teachers/documents..."
          aria-label="Search"
          className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
        />
      </form>

      <ProfileMenu userName={userName} />
    </header>
  );
}
