import { headers } from "next/headers";
import { createApiClient } from "@/lib/api/client";
import { DispatchPanel } from "./dispatch-panel";
import type { Ride, Van } from "@/lib/api/types";

export const dynamic = "force-dynamic";

async function getSSEToken() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const cookie = headersList.get("cookie") || "";

  try {
    const response = await fetch(`${protocol}://${host}/api/internal/sse-token`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error("[dispatch] Failed to get SSE token:", error);
  }
  return null;
}

export default async function DispatchPage() {
  let pendingRides: Ride[] = [];
  let vans: Van[] = [];
  let autoAssignEnabled = true;
  let orgId: string | undefined;

  try {
    const api = await createApiClient();
    const [ridesResult, vansResult, me] = await Promise.all([
      api.getRides({ status: "PENDING", take: 50 }),
      api.getVans(),
      api.getMe(),
    ]);
    pendingRides = ridesResult.data;
    vans = vansResult;

    // Get org settings for auto-assign
    orgId = me.ownedTenants?.[0]?.id || me.membership?.tenantId;
    if (orgId) {
      try {
        const settings = await api.getOrgSettings(orgId);
        autoAssignEnabled = settings.autoAssignEnabled;
      } catch {
        // Use default
      }
    }
  } catch (error) {
    console.error("[dispatch] Error fetching data:", error);
  }

  // Get SSE token for real-time updates
  const sseData = await getSSEToken();

  // If we can't get a token, render without SSE
  if (!sseData?.accessToken) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dispatch</h1>
          <p className="text-muted-foreground mt-1">Create and assign rides</p>
          <p className="text-yellow-600 text-sm mt-2">
            Real-time updates unavailable - refresh page to see changes
          </p>
        </div>
        {/* Fallback to static content */}
        <DispatchPanel
          initialRides={pendingRides}
          initialVans={vans}
          initialAutoAssign={autoAssignEnabled}
          accessToken=""
          tenantId=""
          orgId={orgId}
        />
      </div>
    );
  }

  return (
    <DispatchPanel
      initialRides={pendingRides}
      initialVans={vans}
      initialAutoAssign={autoAssignEnabled}
      accessToken={sseData.accessToken}
      tenantId={sseData.tenantId}
      orgId={orgId}
    />
  );
}
