import { headers } from "next/headers";
import { DispatchPanel } from "./dispatch-panel";
import type { Ride, Van } from "@/lib/api/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function fetchWithCookies(url: string, cookieHeader: string) {
  const response = await fetch(url, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return response.json();
}

export default async function DispatchPage() {
  let pendingRides: Ride[] = [];
  let vans: Van[] = [];
  let autoAssignEnabled = true;
  let orgId: string | undefined;

  // Get request context
  const headersList = await headers();
  const host = headersList.get("host") || "app.staysafeos.com";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const cookieHeader = headersList.get("cookie") || "";
  const baseUrl = `${protocol}://${host}`;

  try {
    // Call internal Route Handlers - they work reliably with Logto session
    const [ridesResult, vansResult, meResult] = await Promise.all([
      fetchWithCookies(`${baseUrl}/api/rides?status=PENDING&take=50`, cookieHeader),
      fetchWithCookies(`${baseUrl}/api/vans`, cookieHeader),
      fetchWithCookies(`${baseUrl}/api/me`, cookieHeader),
    ]);

    pendingRides = ridesResult?.data || [];
    vans = vansResult || [];

    // Get org settings for auto-assign
    orgId = meResult?.ownedTenants?.[0]?.id || meResult?.membership?.tenantId;
    const settings = await fetchWithCookies(`${baseUrl}/api/settings`, cookieHeader);
    if (settings) {
      autoAssignEnabled = settings.autoAssignEnabled ?? true;
    }
  } catch (error) {
    console.error("[dispatch] Error fetching data:", error);
  }

  // Get SSE token for real-time updates
  const sseData = await fetchWithCookies(`${baseUrl}/api/internal/sse-token`, cookieHeader);

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
