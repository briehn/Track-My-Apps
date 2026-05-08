import { LinkButton } from "@/components/ui/link-button";

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-10 sm:px-6 sm:py-16">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(100,116,139,0.12),_transparent_32%)]" />
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center justify-center">
        <div className="w-full rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-sm backdrop-blur sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Track My Apps
          </p>
          <div className="mt-4 space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Page not found
            </h1>
            <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              The page you tried to open does not exist or may have moved.
              Return to the landing page to continue with the app.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/" className="sm:min-w-40">
              Go home
            </LinkButton>
            <LinkButton href="/sign-in" variant="secondary" className="sm:min-w-40">
              Sign in
            </LinkButton>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            If you were looking for your tracker, you can sign in from the
            homepage.
          </p>
        </div>
      </section>
    </main>
  );
}
