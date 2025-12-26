import { headers } from "next/headers";
import { getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { getLogtoConfig } from "@/lib/logto";
import { DriverConsole } from "./driver-console";

export const dynamic = "force-dynamic";

async function fetchWithCookies(url: string, cookieHeader: string) {
  const response = await fetch(url, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });
  if (!response.ok) {
    console.error(`[driver/page] Fetch failed for ${url}:`, response.status);
    return null;
  }
  return response.json();
}

export default async function DriverPage() {
  const logtoConfig = await getLogtoConfig();
  const { isAuthenticated } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated) {
    redirect("/");
  }

  let vans: Array<{
    id: string;
    name: string;
    capacity: number;
    status: string;
  }> = [];

  let currentStatus = {
    online: false,
    van: null as { id: string; name: string } | null,
    role: "DRIVER",
  };

  let tasks: Array<{
    id: string;
    type: string;
    address: string;
    notes?: string;
    position: number;
    ride?: {
      id: string;
      riderName: string;
      riderPhone: string;
      passengerCount: number;
    };
  }> = [];

  try {
    // Use internal Route Handlers instead of createApiClient()
    // Route Handlers work reliably with Logto session, Server Components don't
    const headersList = await headers();
    const host = headersList.get("host") || "app.staysafeos.com";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const cookieHeader = headersList.get("cookie") || "";
    const baseUrl = `${protocol}://${host}`;

    const [vansResult, statusResult, tasksResult] = await Promise.all([
      fetchWithCookies(`${baseUrl}/api/driver/vans`, cookieHeader),
      fetchWithCookies(`${baseUrl}/api/driver/status`, cookieHeader),
      fetchWithCookies(`${baseUrl}/api/driver/tasks`, cookieHeader),
    ]);

    if (vansResult) {
      // Show AVAILABLE vans (can go online) and IN_USE vans (for visibility)
      vans = vansResult.filter((v: { status: string }) => v.status === "AVAILABLE" || v.status === "IN_USE");
    }
    if (statusResult) {
      currentStatus = {
        online: statusResult.online,
        van: statusResult.van ? { id: statusResult.van.id, name: statusResult.van.name } : null,
        role: statusResult.role,
      };
    }
    if (tasksResult) {
      tasks = tasksResult;
    }
  } catch (error) {
    console.error("[driver/page] Error fetching data:", error);
    // Use defaults if API fails
  }

  return (
    <DriverConsole
      initialVans={vans}
      initialStatus={currentStatus}
      initialTasks={tasks}
    />
  );
}
