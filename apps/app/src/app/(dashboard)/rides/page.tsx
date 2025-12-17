import { createApiClient } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from "@staysafeos/ui";
import Link from "next/link";

export default async function RidesPage() {
  let rides: Array<{
    id: string;
    riderName: string;
    riderPhone: string;
    pickupAddress: string;
    dropoffAddress: string;
    passengerCount: number;
    status: string;
    priority: number;
    createdAt: string;
    van?: { name: string };
  }> = [];

  try {
    const api = await createApiClient();
    const result = await api.getRides({ take: 50 });
    rides = result.data;
  } catch {
    // Use empty list if API fails
  }

  const statusCounts = rides.reduce((acc, ride) => {
    acc[ride.status] = (acc[ride.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rides</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor ride requests</p>
        </div>
        <Link href="/dispatch">
          <Button>Create Ride</Button>
        </Link>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        <StatusFilterBadge status="ALL" count={rides.length} active />
        <StatusFilterBadge status="PENDING" count={statusCounts["PENDING"] || 0} />
        <StatusFilterBadge status="ASSIGNED" count={statusCounts["ASSIGNED"] || 0} />
        <StatusFilterBadge status="EN_ROUTE" count={statusCounts["EN_ROUTE"] || 0} />
        <StatusFilterBadge status="PICKED_UP" count={statusCounts["PICKED_UP"] || 0} />
        <StatusFilterBadge status="COMPLETED" count={statusCounts["COMPLETED"] || 0} />
        <StatusFilterBadge status="CANCELLED" count={statusCounts["CANCELLED"] || 0} />
      </div>

      {/* Ride List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Rides</CardTitle>
          <CardDescription>Last 50 rides</CardDescription>
        </CardHeader>
        <CardContent>
          {rides.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No rides found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rides.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusFilterBadge({
  status,
  count,
  active = false,
}: {
  status: string;
  count: number;
  active?: boolean;
}) {
  return (
    <button
      className={`px-3 py-1 rounded-full text-sm ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {status === "ALL" ? "All" : status} ({count})
    </button>
  );
}

function RideCard({
  ride,
}: {
  ride: {
    id: string;
    riderName: string;
    riderPhone: string;
    pickupAddress: string;
    dropoffAddress: string;
    passengerCount: number;
    status: string;
    priority: number;
    createdAt: string;
    van?: { name: string };
  };
}) {
  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ASSIGNED: "bg-blue-100 text-blue-800 border-blue-200",
    EN_ROUTE: "bg-purple-100 text-purple-800 border-purple-200",
    PICKED_UP: "bg-green-100 text-green-800 border-green-200",
    COMPLETED: "bg-gray-100 text-gray-800 border-gray-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{ride.riderName}</span>
            {ride.priority > 0 && (
              <Badge variant="destructive" className="text-xs">
                Priority {ride.priority}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{ride.riderPhone}</p>
          <div className="text-sm mt-2">
            <p>
              <span className="text-muted-foreground">From:</span> {ride.pickupAddress}
            </p>
            <p>
              <span className="text-muted-foreground">To:</span> {ride.dropoffAddress}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {ride.passengerCount} passenger{ride.passengerCount !== 1 ? "s" : ""} ·{" "}
            {new Date(ride.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="text-right space-y-2">
          <Badge className={statusColors[ride.status]}>{ride.status}</Badge>
          {ride.van && <p className="text-sm text-muted-foreground">{ride.van.name}</p>}
          <Link href={`/rides/${ride.id}`}>
            <Button variant="outline" size="sm">
              View
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
