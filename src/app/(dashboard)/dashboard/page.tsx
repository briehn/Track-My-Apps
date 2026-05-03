import { EmptyState } from "@/components/empty-states/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Your job search summary will live here.
          </p>
        </div>
        <Badge>Protected</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Saved</CardTitle>
            <CardDescription>Jobs saved for review.</CardDescription>
          </CardHeader>
          <p className="text-3xl font-semibold text-slate-950">0</p>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Applied</CardTitle>
            <CardDescription>Applications submitted.</CardDescription>
          </CardHeader>
          <p className="text-3xl font-semibold text-slate-950">0</p>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Interviewing</CardTitle>
            <CardDescription>Roles currently in progress.</CardDescription>
          </CardHeader>
          <p className="text-3xl font-semibold text-slate-950">0</p>
        </Card>
      </div>

      <EmptyState
        title="No job activity yet"
        description="The next milestone will add manual job creation. This dashboard is protected and ready for user-owned data."
      />
    </div>
  );
}
