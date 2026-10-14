"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

export const underlineInput =
  "w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-b-2 focus:border-indigo-700 focus:outline-none";

export const linkClass = "text-indigo-700 hover:underline";

// Full-screen auth page: indigo welcome panel on the left, form on the right.
export function AuthLayout({
  switchText,
  switchHref,
  switchLabel,
  children,
}: {
  // Panel prompt for the other auth page, e.g. "Already have an account?".
  switchText: string;
  switchHref: string;
  switchLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-white">
      <WelcomePanel
        switchText={switchText}
        switchHref={switchHref}
        switchLabel={switchLabel}
      />
      <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-12 md:py-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

export function AuthHeading({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="text-3xl font-semibold text-indigo-800">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{children}</p>
    </>
  );
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-slate-700 group-focus-within:text-indigo-700"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function PasswordInput(
  props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        placeholder="••••••••"
        className={`${underlineInput} pr-8`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
      >
        {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>
    </div>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="rounded-md bg-indigo-800 px-8 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-900"
    >
      {children}
    </button>
  );
}

export function OrDivider({ caption }: { caption: string }) {
  return (
    <>
      <div className="mt-12 flex items-center gap-4 text-sm text-slate-500">
        <span className="h-px flex-1 bg-slate-200" />
        OR
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">{caption}</p>
    </>
  );
}

function WelcomePanel({
  switchText,
  switchHref,
  switchLabel,
}: {
  switchText: string;
  switchHref: string;
  switchLabel: string;
}) {
  return (
    <div className="relative hidden w-[45%] flex-col overflow-hidden bg-indigo-800 p-10 text-white md:flex">
      <span className="text-3xl font-bold tracking-tight">Riwaq.</span>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold uppercase">Welcome Back</h2>
        <p className="mt-1 text-indigo-100">
          You&apos;re just one step away from your space.
        </p>

        <Illustration className="mt-10 w-full max-w-xs" />

        <p className="mt-14 text-sm text-indigo-100">
          {switchText}{" "}
          <span className="font-semibold text-white">{switchLabel}</span>
        </p>
        <Link
          href={switchHref}
          aria-label={switchLabel}
          className="mt-5 flex size-12 items-center justify-center rounded-full bg-white text-indigo-800 shadow-md transition-transform hover:scale-105"
        >
          <ArrowRight className="size-5" />
        </Link>
      </div>

      {/* Soft wave along the bottom of the panel. */}
      <svg
        viewBox="0 0 400 160"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-40 w-full text-indigo-700/50"
        aria-hidden
      >
        <path
          d="M0 120 C 120 170, 260 40, 400 50 L 400 160 L 0 160 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

// Two people working at laptops, drawn with simple shapes.
function Illustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 130" className={className} aria-hidden>
      <line x1="0" y1="124" x2="280" y2="124" stroke="#6366f1" strokeWidth="1" />

      {/* Left person */}
      <path d="M30 124 Q30 76 70 72 Q110 76 110 124 Z" fill="#e0e7ff" />
      <path d="M48 124 L52 80 Q70 72 88 80 L92 124 Z" fill="#3730a3" />
      <rect x="64" y="56" width="12" height="18" rx="3" fill="#fcd9b6" />
      <ellipse cx="70" cy="44" rx="15" ry="17" fill="#fcd9b6" />
      <path d="M53 46 Q50 22 70 22 Q92 22 88 48 Q84 32 70 32 Q58 32 53 46 Z" fill="#0f172a" />
      <circle cx="82" cy="58" r="6" fill="#0f172a" />
      {/* Left laptop */}
      <rect x="44" y="86" width="64" height="38" rx="2" fill="#6d4fd8" />
      <circle cx="76" cy="103" r="4" fill="#c7d2fe" />

      {/* Plant */}
      <path d="M140 124 L134 108 L146 108 Z" fill="#4338ca" />
      <path d="M140 110 Q128 100 126 92 Q138 96 140 110 Q142 96 154 92 Q152 100 140 110 Z" fill="#7c5ce6" />

      {/* Right person */}
      <path d="M170 124 Q170 76 210 72 Q250 76 250 124 Z" fill="#e0e7ff" />
      <path d="M188 124 L192 80 Q210 72 228 80 L232 124 Z" fill="#3730a3" />
      <rect x="204" y="56" width="12" height="18" rx="3" fill="#fcd9b6" />
      <ellipse cx="210" cy="44" rx="14" ry="16" fill="#fcd9b6" />
      <path d="M195 42 Q196 22 210 24 L214 16 L218 25 Q228 28 225 42 Q220 30 210 32 Q200 32 195 42 Z" fill="#0f172a" />
      {/* Right laptop */}
      <rect x="180" y="86" width="64" height="38" rx="2" fill="#6d4fd8" />
      <circle cx="212" cy="103" r="4" fill="#c7d2fe" />
    </svg>
  );
}
