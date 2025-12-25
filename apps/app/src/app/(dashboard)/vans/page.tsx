import { headers } from "next/headers";
import { getSessionData, isAdminRole } from "@/lib/session";
import { VanManagement } from "@/components/van-management";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function VansPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let vans: any[] = [];
  let canManage = false;

  try {
    // Get role from internal session (avoids Logto race condition)
    const session = await getSessionData();
    canManage = isAdminRole(session.role);

    // Call internal Route Handler to get vans
    // Route Handlers work reliably with Logto session, Server Components don't
    const headersList = await headers();
    const host = headersList.get("host") || "app.staysafeos.com";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const cookieHeader = headersList.get("cookie") || "";

    const response = await fetch(`${protocol}://${host}/api/vans`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (response.ok) {
      vans = await response.json();
    }
  } catch (error) {
    console.error("[vans/page] Error:", error);
    // Use empty list if API fails
  }

  return <VanManagement vans={vans} canManage={canManage} />;
}
