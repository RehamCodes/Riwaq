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

// No real sign-up yet: any submission goes straight to the app.
export default function SignupPage() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/dashboard");
  }

  return (
    <AuthLayout
      switchText="Already have an account?"
      switchLabel="Login"
      switchHref="/"
    >
      <AuthHeading title="Sign Up">
        Already have an account?{" "}
        <Link href="/" className={linkClass}>
          Login
        </Link>
      </AuthHeading>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        <Field label="Full Name" htmlFor="name">
          <input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Enter your full name"
            className={underlineInput}
          />
        </Field>

        <Field label="Email *" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            className={underlineInput}
          />
        </Field>

        <Field label="Phone No *" htmlFor="phone">
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Phone Number"
            className={underlineInput}
          />
        </Field>

        <div>
          <Field label="Password *" htmlFor="password">
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
            />
          </Field>

          <label className="mt-4 flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" className="size-3.5 accent-indigo-700" />
            <span>
              I accept{" "}
              <Link href="#" className={linkClass}>
                Privacy Policy
              </Link>{" "}
              &amp;{" "}
              <Link href="#" className={linkClass}>
                Terms &amp; Conditions
              </Link>
            </span>
          </label>
        </div>

        <SubmitButton>Sign Up</SubmitButton>
      </form>

      <OrDivider caption="Other signup methods" />
      <div className="mt-4 flex justify-center gap-3">
        <SocialButton label="Google">
          <span className="font-bold text-[#4285F4]">G</span>
        </SocialButton>
        <SocialButton label="Facebook">
          <span className="font-bold text-[#1877F2]">f</span>
        </SocialButton>
      </div>
    </AuthLayout>
  );
}

function SocialButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-md bg-slate-50 px-5 py-2 text-xs font-medium text-indigo-800 shadow-sm ring-1 ring-slate-100 transition-colors hover:bg-slate-100"
    >
      {children}
      {label}
    </button>
  );
}
