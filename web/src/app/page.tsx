"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AuthHeading,
  AuthLayout,
  Field,
  OrDivider,
  PasswordInput,
  SubmitButton,
  linkClass,
  underlineInput,
} from "@/components/auth/AuthLayout";

const socials = [
  { label: "Facebook", glyph: "f" },
  { label: "X", glyph: "𝕏" },
  { label: "LinkedIn", glyph: "in" },
];

// No real authentication yet: any submission goes straight to the app.
export default function LoginPage() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/dashboard");
  }

  return (
    <AuthLayout
      switchText="Don't have an account?"
      switchLabel="Create now"
      switchHref="/signup"
    >
      <AuthHeading title="Login">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className={linkClass}>
          Create account
        </Link>
      </AuthHeading>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        <Field label="User Name" htmlFor="username">
          <input
            id="username"
            name="username"
            autoComplete="username"
            placeholder="you@example.com"
            className={underlineInput}
          />
        </Field>

        <div>
          <Field label="Password" htmlFor="password">
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
            />
          </Field>

          <div className="mt-4 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-600">
              <input type="checkbox" className="size-3.5 accent-indigo-700" />
              Remember me
            </label>
            <Link href="#" className={linkClass}>
              Forgot Password
            </Link>
          </div>
        </div>

        <SubmitButton>Login</SubmitButton>
      </form>

      <OrDivider caption="Continue with social media" />
      <div className="mt-3 flex justify-center gap-2">
        {socials.map(({ label, glyph }) => (
          <button
            key={label}
            type="button"
            aria-label={`Continue with ${label}`}
            title={label}
            className="flex size-7 items-center justify-center rounded-full bg-slate-500 text-[11px] font-bold text-white transition-colors hover:bg-indigo-700"
          >
            {glyph}
          </button>
        ))}
      </div>
    </AuthLayout>
  );
}
