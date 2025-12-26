import { headers } from "next/headers";
import { Button } from "@staysafeos/ui";
import Link from "next/link";
import { RidesList } from "./rides-list";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
    notes?: string;
    createdAt: string;
    assignedAt?: string;
    enRouteAt?: string;
    pickedUpAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    cancelReason?: string;
    van?: { name: string };
  }> = [];

  try {
    // Call internal Route Handler to get rides
    // Route Handlers work reliably with Logto session, Server Components don't
    const headersList = await headers();
    const host = headersList.get("host") || "app.staysafeos.com";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const cookieHeader = headersList.get("cookie") || "";

    const response = await fetch(`${protocol}://${host}/api/rides?take=50`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (response.ok) {
      const result = await response.json();
      rides = result.data || [];
    }
  } catch (error) {
    console.error("[rides/page] Error:", error);
    // Use empty list if API fails
  }

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

      <RidesList rides={rides} />
    </div>
  );
}
