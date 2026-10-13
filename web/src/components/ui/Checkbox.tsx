export function Checkbox({
  label,
  className = "",
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: React.ReactNode;
}) {
  return (
    <label className={`flex items-center gap-2 text-sm ${className}`}>
      <input type="checkbox" className="size-4 accent-[#3f5068]" {...props} />
      {label}
    </label>
  );
}
