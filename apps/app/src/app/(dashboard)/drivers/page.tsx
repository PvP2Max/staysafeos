import { createApiClient } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "@staysafeos/ui";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  let vans: Array<{
    id: string;
    name: string;
    status: string;
    driver?: { id: string; account?: { name?: string; email?: string } };
    tc?: { id: string; account?: { name?: string; email?: string } };
    lastPing?: string;
    lat?: number;
    lng?: number;
  }> = [];

  try {
    const api = await createApiClient();
    const allVans = await api.getVans();
    // Filter to vans that have a driver assigned
    vans = allVans.filter((v) => v.driver || v.tc);
  } catch {
    // Use empty list if API fails
  }

  const onlineCount = vans.filter((v) => v.status === "IN_USE" || v.status === "AVAILABLE").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Drivers</h1>
        <p className="text-muted-foreground mt-1">Online drivers and crew assignments</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardDescription>Online</CardDescription>
            <CardTitle className="text-4xl">{onlineCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Active Vans</CardDescription>
            <CardTitle className="text-4xl">{vans.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Driver List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Crews</CardTitle>
          <CardDescription>Drivers and TCs currently online</CardDescription>
        </CardHeader>
        <CardContent>
          {vans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No active crews</p>
              <p className="text-sm mt-1">Drivers will appear here when they go online</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vans.map((van) => (
                <div
                  key={van.id}
                  className="p-4 border rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {van.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{van.name}</p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {van.driver?.account && (
                          <p>
                            <span className="font-medium">Driver:</span>{" "}
                            {van.driver.account.name || van.driver.account.email}
                          </p>
                        )}
                        {van.tc?.account && (
                          <p>
                            <span className="font-medium">TC:</span>{" "}
                            {van.tc.account.name || van.tc.account.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        van.status === "IN_USE"
                          ? "bg-blue-100 text-blue-800"
                          : van.status === "AVAILABLE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                      }
                    >
                      {van.status}
                    </Badge>
                    {van.lastPing && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last seen: {new Date(van.lastPing).toLocaleTimeString()}
                      </p>
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
