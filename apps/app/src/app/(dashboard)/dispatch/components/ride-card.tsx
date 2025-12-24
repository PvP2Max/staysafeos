"use client";

import { cn } from "@staysafeos/ui";
import type { Ride } from "@/lib/api/types";

interface RideCardProps {
  ride: Ride;
  isSelected?: boolean;
  onClick?: () => void;
}

const priorityColors: Record<number, string> = {
  0: "",
  1: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  2: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  3: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusColors: Record<string, string> = {
  PENDING: "border-l-yellow-500",
  ASSIGNED: "border-l-blue-500",
  EN_ROUTE: "border-l-purple-500",
  PICKED_UP: "border-l-green-500",
  COMPLETED: "border-l-gray-500",
  CANCELLED: "border-l-red-500",
};

export function RideCard({ ride, isSelected, onClick }: RideCardProps) {
  const createdTime = new Date(ride.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const priorityClass = priorityColors[ride.priority] || "";
  const statusClass = statusColors[ride.status] || "";

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 border rounded-lg transition-all cursor-pointer border-l-4",
        statusClass,
        isSelected
          ? "ring-2 ring-primary bg-primary/5 border-primary"
          : "hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{ride.riderName}</p>
            {ride.priority > 0 && (
              <span className={cn("px-1.5 py-0.5 text-xs rounded font-medium", priorityClass)}>
                P{ride.priority}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            <span className="text-green-600">From:</span> {ride.pickupAddress}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            <span className="text-blue-600">To:</span> {ride.dropoffAddress}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs text-muted-foreground">{createdTime}</span>
          <p className="text-xs mt-0.5">
            {ride.passengerCount} pax
          </p>
        </div>
      </div>
      {ride.van && (
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
          Assigned to: <span className="font-medium text-foreground">{ride.van.name}</span>
        </div>
      )}
      {ride.notes && (
        <p className="text-xs text-muted-foreground mt-1 italic truncate">
          Note: {ride.notes}
        </p>
      )}
    </div>
  );
}
