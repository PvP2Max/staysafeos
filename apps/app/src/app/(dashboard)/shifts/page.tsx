import { createApiClient } from "@/lib/api/client";
import { ShiftManagement } from "@/components/shift-management";

export default async function ShiftsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let shifts: any[] = [];
  let canManage = false;

  try {
    const api = await createApiClient();
    shifts = await api.getShifts();

    // Check if user can manage shifts (DISPATCHER, EXECUTIVE, or ADMIN)
    const status = await api.getMembershipStatus();
    canManage = ["EXECUTIVE", "ADMIN", "DISPATCHER"].includes(status.role || "");
  } catch {
    // Use empty list if API fails
  }

  return <ShiftManagement shifts={shifts} canManage={canManage} />;
}
