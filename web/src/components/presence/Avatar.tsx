import {
  Circle,
  CircleCheck,
  CircleMinus,
  CircleX,
  Clock,
  type LucideIcon,
} from "lucide-react";

export type Availability =
  "available" | "busy" | "dnd" | "brb" | "away" | "offline";

export const availabilityOptions: Record<
  Availability,
  { label: string; icon: LucideIcon; color: string; dot: string }
> = {
  available: {
    label: "Available",
    icon: CircleCheck,
    color: "text-emerald-500",
    dot: "bg-emerald-500",
  },
  busy: {
    label: "Busy",
    icon: Circle,
    color: "text-rose-500 fill-rose-500",
    dot: "bg-rose-500",
  },
  dnd: {
    label: "Do not disturb",
    icon: CircleMinus,
    color: "text-rose-500",
    dot: "bg-rose-500",
  },
  brb: {
    label: "Be right back",
    icon: Clock,
    color: "text-amber-500",
    dot: "bg-amber-500",
  },
  away: {
    label: "Appear away",
    icon: Clock,
    color: "text-amber-500",
    dot: "bg-amber-500",
  },
  offline: {
    label: "Appear offline",
    icon: CircleX,
    color: "text-slate-400",
    dot: "bg-slate-400",
  },
};

export function initialsOf(name: string) {
  return name
    .replace(/^(Mr|Ms|Mrs|Dr)\.?\s+/i, "")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const sizes = {
  xs: { avatar: "size-8 text-xs", dot: "size-2.5" },
  sm: { avatar: "size-9 text-sm", dot: "size-3" },
  md: { avatar: "size-10 text-sm", dot: "size-3" },
  lg: { avatar: "size-12 text-base", dot: "size-3.5" },
  xl: { avatar: "size-24 text-3xl", dot: "size-5" },
};

export default function Avatar({
  name,
  availability,
  size = "sm",
  className = "bg-slate-700",
}: {
  name: string;
  availability?: Availability;
  size?: keyof typeof sizes;
  // Background color class.
  className?: string;
}) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className} ${sizes[size].avatar}`}
    >
      {initialsOf(name)}
      {availability && (
        <span
          role="img"
          aria-label={availabilityOptions[availability].label}
          className={`absolute -right-0.5 -bottom-0.5 rounded-full ring-2 ring-white ${availabilityOptions[availability].dot} ${sizes[size].dot}`}
        />
      )}
    </span>
  );
}
