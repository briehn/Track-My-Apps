import { SignOutButton } from "@/features/auth/components/auth-buttons";
import { requireUser } from "@/features/auth/require-user";

export default async function AuthCheckPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
        Protected route
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-950">
        Authentication is working
      </h1>
      <p className="mt-4 text-base leading-7 text-slate-700">
        This page resolved the current user on the server with{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5">
          requireUser()
        </code>
        .
      </p>
      <dl className="mt-8 space-y-3 text-sm text-slate-700">
        <div>
          <dt className="font-medium text-slate-950">User ID</dt>
          <dd className="mt-1 break-all">{user.id}</dd>
        </div>
        {user.email ? (
          <div>
            <dt className="font-medium text-slate-950">Email</dt>
            <dd className="mt-1">{user.email}</dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  );
}
