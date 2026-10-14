import type { LucideIcon } from "lucide-react";
import { ACCENT } from "./attendance-data";

// Card heading with the small accent icon chip.
export default function CardTitle({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2.5 font-semibold text-slate-800">
      <span
        className="flex size-7 items-center justify-center rounded-lg text-white"
        style={{ background: ACCENT }}
      >
        <Icon className="size-4" />
      </span>
      {children}
    </h2>
  );
}
