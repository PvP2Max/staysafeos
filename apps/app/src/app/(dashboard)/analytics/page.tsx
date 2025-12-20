import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@staysafeos/ui";
import {
  BarChart3,
  Car,
  Clock,
  Users,
  TrendingUp,
  Truck,
  Star,
  Activity,
} from "lucide-react";
import { createApiClient } from "@/lib/api/client";

export default async function AnalyticsPage() {
  let analytics: {
    totalRides: number;
    activeRides: number;
    pendingRides: number;
    completedRides: number;
    cancelledRides: number;
    totalDrivers: number;
    onlineDrivers: number;
    totalVans: number;
    availableVans: number;
    avgWaitTime?: number;
    avgRating?: number;
  } = {
    totalRides: 0,
    activeRides: 0,
    pendingRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    totalDrivers: 0,
    onlineDrivers: 0,
    totalVans: 0,
    availableVans: 0,
  };

  try {
    const api = await createApiClient();
    analytics = await api.getAnalyticsSummary();
  } catch (error) {
    console.error("[analytics] Failed to fetch analytics:", error);
  }

  const completionRate = analytics.totalRides > 0
    ? ((analytics.completedRides / analytics.totalRides) * 100).toFixed(1)
    : "0";

  const fleetUtilization = analytics.totalVans > 0
    ? (((analytics.totalVans - analytics.availableVans) / analytics.totalVans) * 100).toFixed(0)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Analytics
        </h1>
        <p className="text-muted-foreground">
          Overview of your organization's operations.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Rides Today"
          value={analytics.totalRides}
          icon={Car}
          description={`${analytics.activeRides} active, ${analytics.pendingRides} pending`}
        />
        <StatsCard
          title="Avg Wait Time"
          value={analytics.avgWaitTime ? `${analytics.avgWaitTime}m` : "N/A"}
          icon={Clock}
          description="Time from request to pickup"
        />
        <StatsCard
          title="Fleet Utilization"
          value={`${fleetUtilization}%`}
          icon={Truck}
          description={`${analytics.availableVans} of ${analytics.totalVans} available`}
        />
        <StatsCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={TrendingUp}
          description={`${analytics.completedRides} completed`}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Online Drivers"
          value={analytics.onlineDrivers}
          icon={Users}
          description={`${analytics.totalDrivers} total drivers`}
        />
        <StatsCard
          title="Active Vans"
          value={analytics.totalVans - analytics.availableVans}
          icon={Activity}
          description={`${analytics.totalVans} in fleet`}
        />
        <StatsCard
          title="Average Rating"
          value={analytics.avgRating ? analytics.avgRating.toFixed(1) : "N/A"}
          icon={Star}
          description="Based on rider feedback"
        />
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rides by Hour</CardTitle>
            <CardDescription>
              Distribution of rides throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center border rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-sm">
                Chart coming soon
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Trends</CardTitle>
            <CardDescription>
              Rides completed over the past 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center border rounded-lg bg-muted/50">
              <p className="text-muted-foreground text-sm">
                Chart coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ride Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ride Status Breakdown</CardTitle>
          <CardDescription>Current status of all rides today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <StatusCard
              label="Pending"
              value={analytics.pendingRides}
              color="bg-yellow-500"
            />
            <StatusCard
              label="Active"
              value={analytics.activeRides}
              color="bg-blue-500"
            />
            <StatusCard
              label="Completed"
              value={analytics.completedRides}
              color="bg-green-500"
            />
            <StatusCard
              label="Cancelled"
              value={analytics.cancelledRides}
              color="bg-red-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatusCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
