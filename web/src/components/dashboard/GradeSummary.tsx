import { grading, letterOf } from "./dashboard-data";

export default function GradeSummary() {
  return (
    <section className="flex flex-col justify-between gap-8 rounded-2xl bg-white p-5 md:p-6">
      <h2 className="text-3xl leading-tight font-medium text-slate-900 md:text-4xl">
        Keep <span className="text-slate-400">Your</span>
        <br />
        Children&apos;s Success
      </h2>
      <div>
        <p className="text-sm text-slate-500">Grading in education</p>
        <p className="mt-1 text-6xl font-light tracking-tight text-brand md:text-7xl">
          {letterOf(grading.score)}, {grading.score}%
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Latest update added:{" "}
          <span className="font-medium text-slate-800">{grading.updated}</span>
        </p>
      </div>
    </section>
  );
}
