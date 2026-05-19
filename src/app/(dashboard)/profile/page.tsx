import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { ProfileForm } from "@/features/profiles/components/profile-form";
import { getProfileForCurrentUser } from "@/features/profiles/queries";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function ProfilePage() {
  const profile = await getProfileForCurrentUser();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Account profile
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Profile</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Keep one private canonical career profile to support matching, preparation, and role targeting across industries.
          </p>
        </div>
        <div className="w-fit rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {profile
            ? `Last updated ${dateFormatter.format(profile.updatedAt)}`
            : "No profile saved yet"}
        </div>
      </div>

      {!profile ? (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-950 dark:text-slate-100">
              Build your private profile to power resume extraction and profile-to-job matching.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Fill in the sections below at your own pace. You can start with only the fields you have ready.
            </p>
          </div>
          <LinkButton href="#career-profile-form" variant="secondary">
            Start building profile
          </LinkButton>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle id="career-profile-form-title">Career profile</CardTitle>
          <CardDescription>
            This profile stays private to your account and is not shared publicly.
          </CardDescription>
        </CardHeader>
        <ProfileForm
          key={profile?.updatedAt.toISOString() ?? "new-profile"}
          profile={profile}
        />
      </Card>
    </div>
  );
}
