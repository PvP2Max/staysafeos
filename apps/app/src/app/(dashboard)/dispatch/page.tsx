import { createApiClient } from "@/lib/api/client";
import { CreateRideForm } from "./create-ride-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@staysafeos/ui";

export default async function DispatchPage() {
  let pendingRides: Array<{
    id: string;
    riderName: string;
    pickupAddress: string;
    dropoffAddress: string;
    passengerCount: number;
    priority: number;
    createdAt: string;
  }> = [];

  let vans: Array<{
    id: string;
    name: string;
    status: string;
    capacity: number;
    driver?: { account?: { name?: string } };
  }> = [];

  try {
    const api = await createApiClient();
    const [ridesResult, vansResult] = await Promise.all([
      api.getRides({ status: "PENDING", take: 20 }),
      api.getVans(),
    ]);
    pendingRides = ridesResult.data;
    vans = vansResult.filter((v) => v.status === "AVAILABLE" || v.status === "IN_USE");
  } catch {
    // Use defaults if API fails
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dispatch</h1>
        <p className="text-muted-foreground mt-1">Create and assign rides</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Ride Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Manual Ride</CardTitle>
            <CardDescription>Dispatcher-initiated ride</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateRideForm vans={vans} />
          </CardContent>
        </Card>

        {/* Pending Rides Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Queue ({pendingRides.length})</CardTitle>
            <CardDescription>Waiting for assignment</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No pending rides</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {pendingRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{ride.riderName}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {ride.pickupAddress}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ride.passengerCount} pax · {new Date(ride.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {ride.priority > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          P{ride.priority}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Vans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Vans</CardTitle>
          <CardDescription>Ready for dispatch</CardDescription>
        </CardHeader>
        <CardContent>
          {vans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No vans available</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vans.map((van) => (
                <div
                  key={van.id}
                  className={`p-4 border rounded-lg ${
                    van.status === "AVAILABLE" ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{van.name}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        van.status === "AVAILABLE"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {van.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Capacity: {van.capacity}
                  </p>
                  {van.driver?.account?.name && (
                    <p className="text-sm text-muted-foreground">
                      Driver: {van.driver.account.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
