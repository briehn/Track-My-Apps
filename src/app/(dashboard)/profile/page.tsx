import { LinkButton } from "@/components/ui/link-button";
import { requireUser } from "@/features/auth/require-user";
import { ProfileForm } from "@/features/profiles/components/profile-form";
import { getProfileForCurrentUser } from "@/features/profiles/queries";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getProfileForCurrentUser();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-slate-100">Profile</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Manage your career profile, resume context, and AI suggestions.
        </p>
      </div>

      {!profile ? (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-950 dark:text-slate-100">
              Start building your profile.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Fill in what you have now and refine it as your search evolves.
            </p>
          </div>
          <LinkButton href="#career-profile-form" variant="secondary">
            Start building profile
          </LinkButton>
        </div>
      ) : null}

      <h2 id="career-profile-form-title" className="sr-only">
        Career profile workspace
      </h2>

      <ProfileForm
        key={profile?.updatedAt.toISOString() ?? "new-profile"}
        viewerName={user.name ?? null}
        lastUpdatedLabel={
          profile ? dateFormatter.format(profile.updatedAt) : "No profile saved yet"
        }
        profile={profile}
      />
    </div>
  );
}
