import { createApiClient } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@staysafeos/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let stats = {
    pendingRides: 0,
    activeRides: 0,
    onlineDrivers: 0,
    completedToday: 0,
  };

  let activeRides: Array<{
    id: string;
    riderName: string;
    pickupAddress: string;
    dropoffAddress: string;
    status: string;
    van?: { name: string };
  }> = [];

  try {
    const api = await createApiClient();
    const [summary, rides] = await Promise.all([
      api.getAnalyticsSummary(),
      api.getActiveRides(),
    ]);

    stats = {
      pendingRides: summary.pendingRides || 0,
      activeRides: summary.activeRides || 0,
      onlineDrivers: summary.onlineDrivers || 0,
      completedToday: summary.completedRides || 0,
    };

    activeRides = rides.slice(0, 10);
  } catch {
    // Use defaults if API fails
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Operations Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time ride management and dispatch</p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard title="Pending Rides" value={stats.pendingRides} variant="warning" />
        <StatCard title="Active Rides" value={stats.activeRides} variant="primary" />
        <StatCard title="Online Drivers" value={stats.onlineDrivers} variant="success" />
        <StatCard title="Completed Today" value={stats.completedToday} variant="default" />
      </div>

      {/* Active Rides */}
      <Card>
        <CardHeader>
          <CardTitle>Active Rides</CardTitle>
          <CardDescription>Current ride activity</CardDescription>
        </CardHeader>
        <CardContent>
          {activeRides.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No active rides</p>
              <p className="text-sm mt-1">Ride activity will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeRides.map((ride) => (
                <div key={ride.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{ride.riderName}</p>
                    <p className="text-sm text-muted-foreground">
                      {ride.pickupAddress} → {ride.dropoffAddress}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={ride.status} />
                    {ride.van && (
                      <p className="text-sm text-muted-foreground mt-1">{ride.van.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  variant = "default",
}: {
  title: string;
  value: number;
  variant?: "default" | "primary" | "success" | "warning";
}) {
  const variantClasses = {
    default: "bg-card",
    primary: "bg-primary/10 border-primary/20",
    success: "bg-green-500/10 border-green-500/20",
    warning: "bg-yellow-500/10 border-yellow-500/20",
  };

  return (
    <Card className={variantClasses[variant]}>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-4xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusClasses: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ASSIGNED: "bg-blue-100 text-blue-800",
    EN_ROUTE: "bg-purple-100 text-purple-800",
    PICKED_UP: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${statusClasses[status] || "bg-gray-100"}`}>
      {status}
    </span>
  );
}
