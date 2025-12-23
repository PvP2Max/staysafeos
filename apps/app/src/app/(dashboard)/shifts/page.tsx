import { createApiClient } from "@/lib/api/client";
import { getSessionData, canManageOperations } from "@/lib/session";
import { ShiftManagement } from "@/components/shift-management";

export const dynamic = "force-dynamic";

export default async function ShiftsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let shifts: any[] = [];
  let canManage = false;

  try {
    // Get role from internal session (avoids Logto race condition)
    const session = await getSessionData();
    canManage = canManageOperations(session.role);

    // Fetch shifts
    const api = await createApiClient();
    shifts = await api.getShifts();
  } catch {
    // Use empty list if API fails
  }

  return <ShiftManagement shifts={shifts} canManage={canManage} />;
}
