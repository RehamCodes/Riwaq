type Variant = "primary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-[#3f5068] font-medium text-white hover:bg-[#34445a] disabled:hover:bg-[#3f5068]",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "text-rose-600 hover:bg-rose-50",
};

export function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

// Icon-only button; `label` is required so it has an accessible name.
export function IconButton({
  label,
  type = "button",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 ${className}`}
      {...props}
    />
  );
}
