"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@staysafeos/ui";
import { Button } from "@staysafeos/ui";
import { Input } from "@staysafeos/ui";
import { Label } from "@staysafeos/ui";
import { Textarea } from "@staysafeos/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@staysafeos/ui";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@staysafeos/ui";
import type { Ride, Van } from "@/lib/api/types";

type ActionTab = "assign" | "cancel" | "edit" | "view";

interface RideActionsDialogProps {
  ride: Ride | null;
  vans: Van[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (rideId: string, vanId: string | null) => Promise<void>;
  onCancel: (rideId: string, reason: string) => Promise<void>;
  onEdit: (rideId: string, data: Partial<Ride>) => Promise<void>;
}

export function RideActionsDialog({
  ride,
  vans,
  open,
  onOpenChange,
  onAssign,
  onCancel,
  onEdit,
}: RideActionsDialogProps) {
  const [activeTab, setActiveTab] = useState<ActionTab>("view");
  const [loading, setLoading] = useState(false);

  // Assign state
  const [selectedVanId, setSelectedVanId] = useState<string>("");

  // Cancel state
  const [cancelReason, setCancelReason] = useState("");

  // Edit state
  const [editForm, setEditForm] = useState({
    riderName: "",
    riderPhone: "",
    passengerCount: 1,
    pickupAddress: "",
    dropoffAddress: "",
    notes: "",
    priority: 0,
  });

  // Reset state when ride changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && ride) {
      setSelectedVanId(ride.vanId || "");
      setCancelReason("");
      setEditForm({
        riderName: ride.riderName,
        riderPhone: ride.riderPhone,
        passengerCount: ride.passengerCount,
        pickupAddress: ride.pickupAddress,
        dropoffAddress: ride.dropoffAddress,
        notes: ride.notes || "",
        priority: ride.priority,
      });
      setActiveTab("view");
    }
    onOpenChange(isOpen);
  };

  const handleAssign = async () => {
    if (!ride) return;
    setLoading(true);
    try {
      await onAssign(ride.id, selectedVanId || null);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!ride) return;
    setLoading(true);
    try {
      await onCancel(ride.id, cancelReason);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!ride) return;
    setLoading(true);
    try {
      await onEdit(ride.id, editForm);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!ride) return null;

  const availableVans = vans.filter(
    (v) => v.status === "AVAILABLE" || v.status === "IN_USE"
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ride: {ride.riderName}</DialogTitle>
          <DialogDescription>
            {ride.status} - Created {new Date(ride.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActionTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="view">View</TabsTrigger>
            <TabsTrigger value="assign">Assign</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="cancel">Cancel</TabsTrigger>
          </TabsList>

          {/* View Tab */}
          <TabsContent value="view" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Rider</p>
                <p className="font-medium">{ride.riderName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{ride.riderPhone}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Passengers</p>
                <p className="font-medium">{ride.passengerCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Priority</p>
                <p className="font-medium">{ride.priority || "Normal"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Pickup</p>
                <p className="font-medium">{ride.pickupAddress}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Dropoff</p>
                <p className="font-medium">{ride.dropoffAddress}</p>
              </div>
              {ride.notes && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Notes</p>
                  <p className="font-medium">{ride.notes}</p>
                </div>
              )}
              {ride.van && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Assigned Van</p>
                  <p className="font-medium">{ride.van.name}</p>
                </div>
              )}
            </div>

            {/* Status Timeline */}
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
          </TabsContent>

          {/* Assign Tab */}
          <TabsContent value="assign" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="van">Select Van</Label>
              <Select
                value={selectedVanId || "__unassigned__"}
                onValueChange={(v) => setSelectedVanId(v === "__unassigned__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a van..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unassigned__">Unassigned (Queue)</SelectItem>
                  {availableVans.map((van) => (
                    <SelectItem key={van.id} value={van.id}>
                      {van.name} - {van.status} (Cap: {van.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={loading}>
                {loading ? "Saving..." : "Save Assignment"}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="riderName">Rider Name</Label>
                <Input
                  id="riderName"
                  value={editForm.riderName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, riderName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="riderPhone">Phone</Label>
                <Input
                  id="riderPhone"
                  value={editForm.riderPhone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, riderPhone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passengerCount">Passengers</Label>
                <Input
                  id="passengerCount"
                  type="number"
                  min="1"
                  max="20"
                  value={editForm.passengerCount}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      passengerCount: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority (0-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  max="10"
                  value={editForm.priority}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="pickupAddress">Pickup Address</Label>
                <Input
                  id="pickupAddress"
                  value={editForm.pickupAddress}
                  onChange={(e) =>
                    setEditForm({ ...editForm, pickupAddress: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="dropoffAddress">Dropoff Address</Label>
                <Input
                  id="dropoffAddress"
                  value={editForm.dropoffAddress}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dropoffAddress: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Cancel Tab */}
          <TabsContent value="cancel" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Reason for cancellation</Label>
              <Textarea
                id="cancelReason"
                placeholder="Enter reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This action will cancel the ride and notify the rider.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={loading}
              >
                {loading ? "Cancelling..." : "Cancel Ride"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
