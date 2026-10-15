import { Landmark } from "lucide-react";

// Static for now; swap for the school record once the server is wired up.
const school = {
  name: "Gwinnett School of Mathematics",
  accreditation: "A",
  id: "12324335",
  address: "970 McElvaney Ln NW, Lawrenceville, GA 30044, United States",
};

const fields = [
  { label: "School Name", value: school.name },
  { label: "Accreditation", value: school.accreditation },
  { label: "School ID", value: school.id },
  { label: "Address", value: school.address, wide: true },
];

export default function SchoolInfoBar() {
  return (
    <section className="flex items-center gap-4 rounded-2xl bg-white p-4 md:gap-6 md:px-5">
      <span className="flex size-12 shrink-0 items-center justify-center self-start rounded-full bg-brand-soft text-brand md:self-center">
        <Landmark className="size-5" />
      </span>
      <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-3 md:flex md:gap-x-12">
        {fields.map(({ label, value, wide }) => (
          <div key={label} className={wide ? "col-span-2 min-w-0" : "min-w-0"}>
            <dt className="text-sm font-semibold text-slate-800">{label}</dt>
            <dd className="mt-1 text-sm text-slate-600">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
