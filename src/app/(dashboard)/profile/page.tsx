import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
          <h1 className="text-2xl font-semibold text-slate-950">Profile</h1>
          <p className="mt-1 text-sm text-slate-600">
            Keep one private canonical career profile for future resume matching and tailoring.
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {profile
            ? `Last updated ${dateFormatter.format(profile.updatedAt)}`
            : "No profile saved yet"}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Career profile</CardTitle>
          <CardDescription>
            This stays private to your account and is not shared publicly.
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
