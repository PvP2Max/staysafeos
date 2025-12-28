import { headers } from "next/headers";
import { getSessionData, canManageShifts } from "@/lib/session";
import { ShiftManagement } from "@/components/shift-management";

export const dynamic = "force-dynamic";

async function fetchWithCookies(url: string, cookieHeader: string) {
  const response = await fetch(url, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });
  if (!response.ok) {
    console.error(`[shifts/page] Fetch failed for ${url}:`, response.status);
    return null;
  }
  return response.json();
}

export default async function ShiftsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let shifts: any[] = [];
  let canManage = false;
  let error: string | null = null;

  try {
    // Get role from internal session (avoids Logto race condition)
    const session = await getSessionData();
    canManage = canManageShifts(session.role);

    // Use internal Route Handler instead of createApiClient()
    // Route Handlers work reliably with Logto session, Server Components don't
    const headersList = await headers();
    const host = headersList.get("host") || "app.staysafeos.com";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const cookieHeader = headersList.get("cookie") || "";
    const baseUrl = `${protocol}://${host}`;

    const result = await fetchWithCookies(`${baseUrl}/api/shifts`, cookieHeader);
    if (result) {
      // Check if result has an error property (debug mode)
      if (result.error) {
        console.error("[shifts/page] API returned error:", result.error);
        error = result.error;
        shifts = result.shifts || [];
      } else if (Array.isArray(result)) {
        shifts = result;
      }
    }
  } catch (err) {
    console.error("[shifts/page] Error fetching data:", err);
    error = err instanceof Error ? err.message : "Failed to load shifts";
  }

  return <ShiftManagement shifts={shifts} canManage={canManage} error={error} />;
}
