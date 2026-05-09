"use client";

import { signIn, signOut } from "next-auth/react";
import type { ButtonHTMLAttributes } from "react";

type SignInWithGoogleButtonProps = {
  callbackUrl?: string;
  label?: string;
};

export function SignInWithGoogleButton({
  callbackUrl = "/dashboard",
  label = "Sign in with Google",
}: SignInWithGoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={() => void signIn("google", { callbackUrl })}
      className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 dark:focus:ring-slate-500 dark:focus:ring-offset-slate-950"
    >
      {label}
    </button>
  );
}

type SignOutButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function SignOutButton({ className, ...props }: SignOutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: "/sign-in" })}
      className={[
        "inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-slate-500 dark:focus:ring-offset-slate-950",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      Sign out
    </button>
  );
}
