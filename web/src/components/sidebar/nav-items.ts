import {
  Activity,
  Backpack,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  MessagesSquare,
  Library,
  Orbit,
  Phone,
  Presentation,
  UserCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  // Overview
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Space", href: "/space", icon: Orbit },
  // Live learning
  { label: "Classes", href: "/classes", icon: Library },
  { label: "Calls", href: "/calls", icon: Phone },
  { label: "Courses", href: "/courses", icon: BookOpen },
  { label: "Activities", href: "/activities", icon: Activity },
  { label: "Bag", href: "/bag", icon: Backpack },
  // Assessment & tracking
  { label: "Exams", href: "/exams", icon: ClipboardList },
  { label: "Assessment", href: "/assessment", icon: ClipboardCheck },
  { label: "Attendance", href: "/attendance", icon: UserCheck },
  { label: "Chats", href: "/chats", icon: MessagesSquare },
  // People & admin
  { label: "Students", href: "/students", icon: GraduationCap },
  { label: "Teachers", href: "/teachers", icon: Presentation },
  { label: "Payment", href: "/payment", icon: Wallet },
];

export function isActive(href: string, pathname: string | null) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
