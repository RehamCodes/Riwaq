type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

const base =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none disabled:bg-slate-50";

export function Input({
  type = "text",
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type={type} className={`${base} ${className}`} {...props} />;
}

// Value format: "YYYY-MM-DD".
export function DateInput(props: InputProps) {
  return <Input type="date" {...props} />;
}

// Value format: "HH:MM" (24h); the browser shows it in the user's format.
export function TimeInput(props: InputProps) {
  return <Input type="time" {...props} />;
}
