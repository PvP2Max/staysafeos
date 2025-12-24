"use client";

import { cn } from "@staysafeos/ui";
import type { Van } from "@/lib/api/types";

interface VanCardProps {
  van: Van;
  onClick?: () => void;
}

const statusConfig: Record<string, { bgColor: string; textColor: string; label: string }> = {
  AVAILABLE: {
    bgColor: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    textColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    label: "Available",
  },
  IN_USE: {
    bgColor: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
    textColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    label: "In Use",
  },
  MAINTENANCE: {
    bgColor: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
    textColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    label: "Maintenance",
  },
  OFFLINE: {
    bgColor: "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700",
    textColor: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    label: "Offline",
  },
};

export function VanCard({ van, onClick }: VanCardProps) {
  const config = statusConfig[van.status] || statusConfig.OFFLINE;

  const driverName = van.driver?.account?.email?.split("@")[0] || "Unassigned";
  const tcName = van.tc?.account?.email?.split("@")[0];

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 border rounded-lg transition-all cursor-pointer hover:shadow-md",
        config.bgColor
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{van.name}</span>
        <span className={cn("px-2 py-1 rounded text-xs font-medium", config.textColor)}>
          {config.label}
        </span>
      </div>
      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
        <p>Capacity: {van.capacity}</p>
        <p>Driver: {driverName}</p>
        {tcName && <p>TC: {tcName}</p>}
        {van.licensePlate && <p>Plate: {van.licensePlate}</p>}
      </div>
      {van.tasks && van.tasks.length > 0 && (
        <div className="mt-2 pt-2 border-t text-xs">
          <span className="text-muted-foreground">
            {van.tasks.length} task{van.tasks.length !== 1 ? "s" : ""} in queue
          </span>
        </div>
      )}
    </div>
  );
}
