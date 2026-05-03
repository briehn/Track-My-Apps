"use client";

import { signIn, signOut } from "next-auth/react";

type SignInWithGoogleButtonProps = {
  callbackUrl?: string;
};

export function SignInWithGoogleButton({
  callbackUrl = "/auth-check",
}: SignInWithGoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={() => void signIn("google", { callbackUrl })}
      className="inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
    >
      Sign in with Google
    </button>
  );
}

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: "/sign-in" })}
      className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
    >
      Sign out
    </button>
  );
}
