"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  School,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { isActive, navItems } from "./nav-items";

const itemBase =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";
const itemIdle = "text-slate-100 hover:bg-white/10";
const itemActive = "bg-white text-brand shadow-sm";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={`${itemBase} ${active ? itemActive : itemIdle} ${
        collapsed ? "justify-center" : ""
      }`}
    >
      <Icon className="size-5 shrink-0" strokeWidth={1.75} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function NavList({
  pathname,
  collapsed,
}: {
  pathname: string | null;
  collapsed: boolean;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {navItems.map((item) => (
        <li key={item.href}>
          <NavLink
            {...item}
            active={isActive(item.href, pathname)}
            collapsed={collapsed}
          />
        </li>
      ))}
    </ul>
  );
}

// usePathname may suspend with cacheComponents on dynamic routes,
// so it lives in its own component behind a Suspense boundary.
function ActiveNavList({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  return <NavList pathname={pathname} collapsed={collapsed} />;
}

function SettingsLink({
  pathname,
  collapsed,
}: {
  pathname: string | null;
  collapsed: boolean;
}) {
  return (
    <NavLink
      href="/settings"
      label="Settings"
      icon={Settings}
      active={isActive("/settings", pathname)}
      collapsed={collapsed}
    />
  );
}

function ActiveSettingsLink({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  return <SettingsLink pathname={pathname} collapsed={collapsed} />;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={`hidden h-full shrink-0 p-3 md:block transition-[width] duration-300 ${
        collapsed ? "w-24" : "w-64"
      }`}
    >
      <div className="flex h-full flex-col rounded-2xl bg-brand p-3 text-white">
        <div
          className={`flex items-center gap-2 px-2 py-3 ${
            collapsed ? "flex-col" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-2">
            <School className="size-6 shrink-0 text-gold" />
            {!collapsed && (
              <span className="text-lg font-bold tracking-wide">SCHOOL</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="rounded-md p-1.5 text-slate-200 hover:bg-white/10"
          >
            <ToggleIcon className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <hr className="my-3 border-white/15" />

        <nav className="flex-1 overflow-y-auto">
          <Suspense
            fallback={<NavList pathname={null} collapsed={collapsed} />}
          >
            <ActiveNavList collapsed={collapsed} />
          </Suspense>
        </nav>

        <div className="flex flex-col gap-1 pt-3">
          <Suspense
            fallback={<SettingsLink pathname={null} collapsed={collapsed} />}
          >
            <ActiveSettingsLink collapsed={collapsed} />
          </Suspense>
          <button
            type="button"
            title={collapsed ? "Logout" : undefined}
            className={`${itemBase} ${itemIdle} ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="size-5 shrink-0" strokeWidth={1.75} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
