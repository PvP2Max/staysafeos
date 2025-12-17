import { createApiClient } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "@staysafeos/ui";

export default async function VansPage() {
  let vans: Array<{
    id: string;
    name: string;
    capacity: number;
    licensePlate?: string;
    status: string;
    lat?: number;
    lng?: number;
    lastPing?: string;
    driver?: { account?: { name?: string } };
    tc?: { account?: { name?: string } };
  }> = [];

  try {
    const api = await createApiClient();
    vans = await api.getVans();
  } catch {
    // Use empty list if API fails
  }

  const statusCounts = vans.reduce((acc, van) => {
    acc[van.status] = (acc[van.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fleet</h1>
        <p className="text-muted-foreground mt-1">Van status and assignments</p>
      </div>

      {/* Status Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatusCard status="AVAILABLE" count={statusCounts["AVAILABLE"] || 0} color="green" />
        <StatusCard status="IN_USE" count={statusCounts["IN_USE"] || 0} color="blue" />
        <StatusCard status="MAINTENANCE" count={statusCounts["MAINTENANCE"] || 0} color="yellow" />
        <StatusCard status="OFFLINE" count={statusCounts["OFFLINE"] || 0} color="gray" />
      </div>

      {/* Van Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vans.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="text-center py-12 text-muted-foreground">
              <p>No vans in fleet</p>
            </CardContent>
          </Card>
        ) : (
          vans.map((van) => <VanCard key={van.id} van={van} />)
        )}
      </div>
    </div>
  );
}

function StatusCard({
  status,
  count,
  color,
}: {
  status: string;
  count: number;
  color: "green" | "blue" | "yellow" | "gray";
}) {
  const colorClasses = {
    green: "bg-green-50 border-green-200",
    blue: "bg-blue-50 border-blue-200",
    yellow: "bg-yellow-50 border-yellow-200",
    gray: "bg-gray-50 border-gray-200",
  };

  return (
    <Card className={colorClasses[color]}>
      <CardHeader className="pb-2">
        <CardDescription>{status}</CardDescription>
        <CardTitle className="text-3xl">{count}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function VanCard({
  van,
}: {
  van: {
    id: string;
    name: string;
    capacity: number;
    licensePlate?: string;
    status: string;
    lastPing?: string;
    driver?: { account?: { name?: string } };
    tc?: { account?: { name?: string } };
  };
}) {
  const statusColors: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-800",
    IN_USE: "bg-blue-100 text-blue-800",
    MAINTENANCE: "bg-yellow-100 text-yellow-800",
    OFFLINE: "bg-gray-100 text-gray-800",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{van.name}</CardTitle>
          <Badge className={statusColors[van.status]}>{van.status}</Badge>
        </div>
        {van.licensePlate && (
          <CardDescription>{van.licensePlate}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">
          <span className="text-muted-foreground">Capacity:</span> {van.capacity}
        </p>
        {van.driver?.account?.name && (
          <p className="text-sm">
            <span className="text-muted-foreground">Driver:</span> {van.driver.account.name}
          </p>
        )}
        {van.tc?.account?.name && (
          <p className="text-sm">
            <span className="text-muted-foreground">TC:</span> {van.tc.account.name}
          </p>
        )}
        {van.lastPing && (
          <p className="text-xs text-muted-foreground">
            Last ping: {new Date(van.lastPing).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
