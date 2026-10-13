export type ColorOption<T extends string> = {
  value: T;
  label: string;
  // Background class for the swatch, e.g. "bg-indigo-500".
  swatch: string;
};

export function ColorPicker<T extends string>({
  options,
  value,
  onChange,
  legend = "Color",
}: {
  options: ColorOption<T>[];
  value: T;
  onChange: (value: T) => void;
  legend?: string;
}) {
  return (
    <fieldset className="flex items-center gap-2">
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.label}
          aria-pressed={option.value === value}
          title={option.label}
          onClick={() => onChange(option.value)}
          className={`size-6 rounded-full ${option.swatch} ${
            option.value === value ? "ring-2 ring-slate-700 ring-offset-2" : ""
          }`}
        />
      ))}
    </fieldset>
  );
}
