"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { isActive, navItems, type NavItem } from "./nav-items";

// Pinned tab stays fixed at the start; the rest scroll horizontally.
const PINNED_HREF = "/activities";

type TabItem = NavItem & { iconOnly?: boolean };

const allItems: TabItem[] = [
  ...navItems,
  { label: "Settings", href: "/settings", icon: Settings, iconOnly: true },
];
const pinned = allItems.find((item) => item.href === PINNED_HREF)!;
const items = allItems.filter((item) => item.href !== PINNED_HREF);

function Tab({
  item: { href, label, icon: Icon, iconOnly },
  pathname,
}: {
  item: TabItem;
  pathname: string | null;
}) {
  const active = isActive(href, pathname);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={iconOnly ? label : undefined}
      className={`flex h-full w-18 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium ${
        active ? "text-white" : "text-slate-300"
      }`}
    >
      <span
        className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
          active ? "bg-white/20" : ""
        }`}
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      {!iconOnly && (
        <span className="w-full truncate text-center">{label}</span>
      )}
    </Link>
  );
}

function TabList({ pathname }: { pathname: string | null }) {
  const listRef = useRef<HTMLUListElement>(null);

  // Keep the current tab visible in the horizontally scrolling bar.
  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <div className="flex">
      <div className="shrink-0 border-r border-white/15 px-1">
        <Tab item={pinned} pathname={pathname} />
      </div>
      <ul
        ref={listRef}
        className="flex min-w-0 flex-1 snap-x gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <li key={item.href} className="flex snap-start">
            <Tab item={item} pathname={pathname} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// usePathname may suspend with cacheComponents on dynamic routes,
// so it lives in its own component behind a Suspense boundary.
function ActiveTabList() {
  const pathname = usePathname();
  return <TabList pathname={pathname} />;
}

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 bg-[#3f5068] pb-[env(safe-area-inset-bottom)] md:hidden">
      <Suspense fallback={<TabList pathname={null} />}>
        <ActiveTabList />
      </Suspense>
    </nav>
  );
}
