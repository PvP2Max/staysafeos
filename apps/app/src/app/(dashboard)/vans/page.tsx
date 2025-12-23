import { createApiClient } from "@/lib/api/client";
import { getSessionData, isAdminRole } from "@/lib/session";
import { VanManagement } from "@/components/van-management";

export const dynamic = "force-dynamic";

export default async function VansPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let vans: any[] = [];
  let canManage = false;

  try {
    // Get role from internal session (avoids Logto race condition)
    const session = await getSessionData();
    canManage = isAdminRole(session.role);

    // Fetch vans
    const api = await createApiClient();
    vans = await api.getVans();
  } catch {
    // Use empty list if API fails
  }

  return <VanManagement vans={vans} canManage={canManage} />;
}
