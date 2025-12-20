import { createApiClient } from "@/lib/api/client";
import { VanManagement } from "@/components/van-management";

export default async function VansPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let vans: any[] = [];
  let canManage = false;

  try {
    const api = await createApiClient();
    vans = await api.getVans();

    // Check if user can manage vans (EXECUTIVE or ADMIN)
    const status = await api.getMembershipStatus();
    canManage = ["EXECUTIVE", "ADMIN"].includes(status.role || "");
  } catch {
    // Use empty list if API fails
  }

  return <VanManagement vans={vans} canManage={canManage} />;
}
