import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { createApiClient } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@staysafeos/ui";

export default async function DashboardPage() {
  const { claims } = await getLogtoContext(logtoConfig);

  let stats = {
    totalRides: 0,
    onlineDrivers: 0,
    totalVolunteers: 0,
    totalVans: 0,
  };

  try {
    const api = await createApiClient();
    const summary = await api.getAnalyticsSummary();
    stats = {
      totalRides: summary.totalRides || 0,
      onlineDrivers: summary.onlineDrivers || 0,
      totalVolunteers: summary.totalVolunteers || 0,
      totalVans: summary.totalVans || 0,
    };
  } catch {
    // Use default stats if API fails
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {claims?.name || claims?.email || "User"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization&apos;s StaySafeOS settings
        </p>
      </div>

      {/* Stats Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        <div className="grid gap-6 md:grid-cols-4">
          <StatCard title="Total Rides" value={stats.totalRides.toString()} description="This month" />
          <StatCard title="Active Drivers" value={stats.onlineDrivers.toString()} description="Currently online" />
          <StatCard title="Volunteers" value={stats.totalVolunteers.toString()} description="Registered" />
          <StatCard title="Vans" value={stats.totalVans.toString()} description="In fleet" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-4xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
