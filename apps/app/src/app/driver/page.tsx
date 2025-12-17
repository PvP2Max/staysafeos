import { createApiClient } from "@/lib/api/client";
import { getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { logtoConfig } from "@/lib/logto";
import { DriverConsole } from "./driver-console";

export default async function DriverPage() {
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
    sortOrder: number;
    ride?: {
      id: string;
      riderName: string;
      riderPhone: string;
      passengerCount: number;
    };
  }> = [];

  try {
    const api = await createApiClient();
    const [vansResult, statusResult, tasksResult] = await Promise.all([
      api.getVans(),
      api.getMyStatus().catch(() => null),
      api.getMyTasks().catch(() => []),
    ]);

    vans = vansResult.filter((v) => v.status === "AVAILABLE");
    if (statusResult) {
      currentStatus = {
        online: statusResult.online,
        van: statusResult.van ? { id: statusResult.van.id, name: statusResult.van.name } : null,
        role: statusResult.role,
      };
    }
    tasks = tasksResult;
  } catch {
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
