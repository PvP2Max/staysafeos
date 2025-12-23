import { createApiClient } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@staysafeos/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let stats = {
    totalMembers: 0,
    totalRides: 0,
    totalVans: 0,
    avgRating: 0,
  };

  try {
    const api = await createApiClient();
    const summary = await api.getAnalyticsSummary();
    stats = {
      totalMembers: summary.totalDrivers || 0,
      totalRides: summary.totalRides || 0,
      totalVans: summary.totalVans || 0,
      avgRating: summary.avgRating || 0,
    };
  } catch {
    // Use defaults if API fails
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-muted-foreground mt-1">Organization management</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Rides</CardDescription>
            <CardTitle className="text-3xl">{stats.totalRides}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Team Members</CardDescription>
            <CardTitle className="text-3xl">{stats.totalMembers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fleet Size</CardDescription>
            <CardTitle className="text-3xl">{stats.totalVans}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Rating</CardDescription>
            <CardTitle className="text-3xl">
              {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Admin Sections */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AdminCard
          href="/admin/members"
          title="Team Members"
          description="Manage users, roles, and permissions"
        />
        <AdminCard
          href="/admin/training"
          title="Training Modules"
          description="Create and manage training content"
        />
        <AdminCard
          href="/admin/shifts"
          title="Shift Management"
          description="Create shifts and view coverage"
        />
        <AdminCard
          href="/admin/analytics"
          title="Analytics"
          description="View reports and export data"
        />
        <AdminCard
          href="/admin/support-codes"
          title="Support Codes"
          description="Generate codes for role elevation"
        />
        <AdminCard
          href="/admin/fleet"
          title="Fleet Management"
          description="Add and manage vans"
        />
        <AdminCard
          href="/admin/settings"
          title="Organization Settings"
          description="Configure required fields and preferences"
        />
      </div>
    </div>
  );
}

function AdminCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary cursor-pointer transition-colors h-full">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="ghost" size="sm">
            Manage →
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
