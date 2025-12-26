"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@staysafeos/ui";

interface Ride {
  id: string;
  riderName: string;
  riderPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  passengerCount: number;
  status: string;
  priority: number;
  notes?: string;
  createdAt: string;
  assignedAt?: string;
  enRouteAt?: string;
  pickedUpAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  van?: { name: string };
}

interface RidesListProps {
  rides: Ride[];
}

export function RidesList({ rides }: RidesListProps) {
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  const statusCounts = rides.reduce((acc, ride) => {
    acc[ride.status] = (acc[ride.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        <StatusFilterBadge status="ALL" count={rides.length} active />
        <StatusFilterBadge status="PENDING" count={statusCounts["PENDING"] || 0} />
        <StatusFilterBadge status="ASSIGNED" count={statusCounts["ASSIGNED"] || 0} />
        <StatusFilterBadge status="EN_ROUTE" count={statusCounts["EN_ROUTE"] || 0} />
        <StatusFilterBadge status="PICKED_UP" count={statusCounts["PICKED_UP"] || 0} />
        <StatusFilterBadge status="COMPLETED" count={statusCounts["COMPLETED"] || 0} />
        <StatusFilterBadge status="CANCELLED" count={statusCounts["CANCELLED"] || 0} />
      </div>

      {/* Ride List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Rides</CardTitle>
          <CardDescription>Last 50 rides</CardDescription>
        </CardHeader>
        <CardContent>
          {rides.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No rides found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onView={() => setSelectedRide(ride)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ride Details Dialog */}
      <RideDetailsDialog
        ride={selectedRide}
        open={!!selectedRide}
        onOpenChange={(open) => !open && setSelectedRide(null)}
      />
    </>
  );
}

function StatusFilterBadge({
  status,
  count,
  active = false,
}: {
  status: string;
  count: number;
  active?: boolean;
}) {
  return (
    <button
      className={`px-3 py-1 rounded-full text-sm ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {status === "ALL" ? "All" : status} ({count})
    </button>
  );
}

function RideCard({
  ride,
  onView,
}: {
  ride: Ride;
  onView: () => void;
}) {
  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ASSIGNED: "bg-blue-100 text-blue-800 border-blue-200",
    EN_ROUTE: "bg-purple-100 text-purple-800 border-purple-200",
    PICKED_UP: "bg-green-100 text-green-800 border-green-200",
    COMPLETED: "bg-gray-100 text-gray-800 border-gray-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{ride.riderName}</span>
            {ride.priority > 0 && (
              <Badge variant="destructive" className="text-xs">
                Priority {ride.priority}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{ride.riderPhone}</p>
          <div className="text-sm mt-2">
            <p>
              <span className="text-muted-foreground">From:</span> {ride.pickupAddress}
            </p>
            <p>
              <span className="text-muted-foreground">To:</span> {ride.dropoffAddress}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {ride.passengerCount} passenger{ride.passengerCount !== 1 ? "s" : ""} ·{" "}
            {new Date(ride.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="text-right space-y-2">
          <Badge className={statusColors[ride.status]}>{ride.status}</Badge>
          {ride.van && <p className="text-sm text-muted-foreground">{ride.van.name}</p>}
          <Button variant="outline" size="sm" onClick={onView}>
            View
          </Button>
        </div>
      </div>
    </div>
  );
}

function RideDetailsDialog({
  ride,
  open,
  onOpenChange,
}: {
  ride: Ride | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!ride) return null;

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ASSIGNED: "bg-blue-100 text-blue-800",
    EN_ROUTE: "bg-purple-100 text-purple-800",
    PICKED_UP: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {ride.riderName}
            <Badge className={statusColors[ride.status]}>{ride.status}</Badge>
          </DialogTitle>
          <DialogDescription>
            Created {new Date(ride.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rider Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{ride.riderPhone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Passengers</p>
              <p className="font-medium">{ride.passengerCount}</p>
            </div>
            {ride.priority > 0 && (
              <div>
                <p className="text-muted-foreground">Priority</p>
                <p className="font-medium">{ride.priority}</p>
              </div>
            )}
            {ride.van && (
              <div>
                <p className="text-muted-foreground">Assigned Van</p>
                <p className="font-medium">{ride.van.name}</p>
              </div>
            )}
          </div>

          {/* Addresses */}
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Pickup</p>
              <p className="font-medium">{ride.pickupAddress}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dropoff</p>
              <p className="font-medium">{ride.dropoffAddress}</p>
            </div>
          </div>

          {/* Notes */}
          {ride.notes && (
            <div className="text-sm">
              <p className="text-muted-foreground">Notes</p>
              <p className="font-medium">{ride.notes}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-2">Timeline</p>
            <div className="space-y-1 text-sm">
              <p>Created: {new Date(ride.createdAt).toLocaleString()}</p>
              {ride.assignedAt && (
                <p>Assigned: {new Date(ride.assignedAt).toLocaleString()}</p>
              )}
              {ride.enRouteAt && (
                <p>En Route: {new Date(ride.enRouteAt).toLocaleString()}</p>
              )}
              {ride.pickedUpAt && (
                <p>Picked Up: {new Date(ride.pickedUpAt).toLocaleString()}</p>
              )}
              {ride.completedAt && (
                <p>Completed: {new Date(ride.completedAt).toLocaleString()}</p>
              )}
              {ride.cancelledAt && (
                <p className="text-red-600">
                  Cancelled: {new Date(ride.cancelledAt).toLocaleString()}
                  {ride.cancelReason && ` - ${ride.cancelReason}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
