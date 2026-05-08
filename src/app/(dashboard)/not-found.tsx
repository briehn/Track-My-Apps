import { EmptyState } from "@/components/empty-states/empty-state";
import { LinkButton } from "@/components/ui/link-button";

export default function DashboardNotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl items-center">
      <EmptyState
        title="Workspace page not found"
        description="This route is not part of your Track My Apps workspace. Use the dashboard or jobs list to get back to something useful."
        action={
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <LinkButton href="/dashboard" className="sm:min-w-36">
              Go to dashboard
            </LinkButton>
            <LinkButton href="/jobs" variant="secondary" className="sm:min-w-36">
              View jobs
            </LinkButton>
            <LinkButton href="/" variant="ghost" className="sm:min-w-36">
              Go home
            </LinkButton>
          </div>
        }
      />
    </div>
  );
}
