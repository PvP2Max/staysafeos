"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@staysafeos/ui";
import { Switch } from "@staysafeos/ui";
import { Badge } from "@staysafeos/ui";
import { useDispatchState } from "./use-dispatch-sse";
import { RideCard } from "./components/ride-card";
import { VanCard } from "./components/van-card";
import { RideActionsDialog } from "./components/ride-actions-dialog";
import { CreateRideForm } from "./create-ride-form";
import type { Ride, Van } from "@/lib/api/types";

interface DispatchPanelProps {
  initialRides: Ride[];
  initialVans: Van[];
  initialAutoAssign: boolean;
  accessToken: string;
  tenantId?: string;
  orgId?: string;
}

export function DispatchPanel({
  initialRides,
  initialVans,
  initialAutoAssign,
  accessToken,
  tenantId,
  orgId,
}: DispatchPanelProps) {
  const { rides, vans, sseState, updateRide, removeRide } = useDispatchState(
    initialRides,
    initialVans,
    accessToken,
    tenantId
  );

  const [autoAssignEnabled, setAutoAssignEnabled] = useState(initialAutoAssign);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Filter rides by status
  const pendingRides = rides.filter((r) => r.status === "PENDING");
  const activeRides = rides.filter(
    (r) => r.status === "ASSIGNED" || r.status === "EN_ROUTE" || r.status === "PICKED_UP"
  );

  // Filter vans
  const availableVans = vans.filter(
    (v) => v.status === "AVAILABLE" || v.status === "IN_USE"
  );

  const handleRideClick = (ride: Ride) => {
    setSelectedRide(ride);
    setDialogOpen(true);
  };

  const handleAutoAssignToggle = useCallback(
    async (enabled: boolean) => {
      if (!orgId) return;
      setUpdating(true);
      try {
        const response = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ autoAssignEnabled: enabled }),
        });
        if (response.ok) {
          setAutoAssignEnabled(enabled);
        }
      } finally {
        setUpdating(false);
      }
    },
    [orgId]
  );

  const handleAssign = useCallback(
    async (rideId: string, vanId: string | null) => {
      try {
        const response = await fetch(`/api/rides/${rideId}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vanId }),
        });
        if (response.ok) {
          const updatedRide = await response.json();
          if (updatedRide?.id) {
            updateRide(rideId, updatedRide);
          }
        } else {
          const error = await response.json().catch(() => ({ error: "Failed to assign ride" }));
          console.error("[dispatch] Assign failed:", error);
        }
      } catch (error) {
        console.error("[dispatch] Assign error:", error);
      }
    },
    [updateRide]
  );

  const handleCancel = useCallback(
    async (rideId: string, reason: string) => {
      try {
        const response = await fetch(`/api/rides/${rideId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });
        if (response.ok) {
          removeRide(rideId);
        } else {
          const error = await response.json().catch(() => ({ error: "Failed to cancel ride" }));
          console.error("[dispatch] Cancel failed:", error);
        }
      } catch (error) {
        console.error("[dispatch] Cancel error:", error);
      }
    },
    [removeRide]
  );

  const handleEdit = useCallback(
    async (rideId: string, data: Partial<Ride>) => {
      try {
        const response = await fetch(`/api/rides/${rideId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const updatedRide = await response.json();
          if (updatedRide?.id) {
            updateRide(rideId, updatedRide);
          }
        } else {
          const error = await response.json().catch(() => ({ error: "Failed to update ride" }));
          console.error("[dispatch] Edit failed:", error);
        }
      } catch (error) {
        console.error("[dispatch] Edit error:", error);
      }
    },
    [updateRide]
  );

  return (
    <div className="space-y-6">
      {/* Header with SSE status and Auto-assign toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dispatch</h1>
          <p className="text-muted-foreground mt-1">Create and assign rides</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                sseState.connected
                  ? "bg-green-500"
                  : sseState.reconnecting
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-red-500"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {sseState.connected
                ? "Live"
                : sseState.reconnecting
                  ? "Reconnecting..."
                  : "Disconnected"}
            </span>
          </div>

          {/* Auto-assign Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              checked={autoAssignEnabled}
              onCheckedChange={handleAutoAssignToggle}
              disabled={updating}
            />
            <span className="text-sm">Auto-Assign</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Ride Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Manual Ride</CardTitle>
            <CardDescription>Dispatcher-initiated ride</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateRideForm vans={availableVans} showSkipAutoAssign={autoAssignEnabled} />
          </CardContent>
        </Card>

        {/* Pending Rides Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Queue</CardTitle>
                <CardDescription>Waiting for assignment</CardDescription>
              </div>
              <Badge variant="secondary">{pendingRides.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pendingRides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No pending rides</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {pendingRides.map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    isSelected={selectedRide?.id === ride.id}
                    onClick={() => handleRideClick(ride)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Rides */}
      {activeRides.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Rides</CardTitle>
                <CardDescription>Currently in progress</CardDescription>
              </div>
              <Badge variant="default">{activeRides.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeRides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  isSelected={selectedRide?.id === ride.id}
                  onClick={() => handleRideClick(ride)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Vans */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Vans</CardTitle>
              <CardDescription>Ready for dispatch</CardDescription>
            </div>
            <Badge variant="outline">{availableVans.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {availableVans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No vans available</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableVans.map((van) => (
                <VanCard key={van.id} van={van} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ride Actions Dialog */}
      <RideActionsDialog
        ride={selectedRide}
        vans={availableVans}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAssign={handleAssign}
        onCancel={handleCancel}
        onEdit={handleEdit}
      />
    </div>
  );
}
