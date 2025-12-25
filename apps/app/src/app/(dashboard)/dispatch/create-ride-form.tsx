"use client";

import { useState, useTransition, useCallback } from "react";
import { Button, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from "@staysafeos/ui";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { RiderSearch, type RiderSelection } from "@/components/rider-search";

interface Van {
  id: string;
  name: string;
  status: string;
}

interface CreateRideFormProps {
  vans: Van[];
  showSkipAutoAssign?: boolean;
}

export function CreateRideForm({ vans, showSkipAutoAssign = false }: CreateRideFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    riderName: "",
    riderPhone: "",
    membershipId: undefined as string | undefined,
    passengerCount: "1",
    pickupAddress: "",
    pickupLat: undefined as number | undefined,
    pickupLng: undefined as number | undefined,
    dropoffAddress: "",
    dropoffLat: undefined as number | undefined,
    dropoffLng: undefined as number | undefined,
    notes: "",
    vanId: "",
    priority: "0",
    skipAutoAssign: false,
  });

  const handlePickupChange = useCallback((address: string, lat?: number, lng?: number) => {
    setFormData((prev) => ({
      ...prev,
      pickupAddress: address,
      pickupLat: lat,
      pickupLng: lng,
    }));
  }, []);

  const handleDropoffChange = useCallback((address: string, lat?: number, lng?: number) => {
    setFormData((prev) => ({
      ...prev,
      dropoffAddress: address,
      dropoffLat: lat,
      dropoffLng: lng,
    }));
  }, []);

  const handleRiderSelect = useCallback((rider: RiderSelection) => {
    setFormData((prev) => ({
      ...prev,
      riderName: rider.name,
      riderPhone: rider.phone,
      membershipId: rider.membershipId,
      // If rider has a home address, offer it as dropoff
      dropoffAddress: rider.homeAddress || prev.dropoffAddress,
      dropoffLat: undefined,
      dropoffLng: undefined,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/rides/manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            riderName: formData.riderName,
            riderPhone: formData.riderPhone,
            passengerCount: parseInt(formData.passengerCount),
            pickupAddress: formData.pickupAddress,
            pickupLat: formData.pickupLat,
            pickupLng: formData.pickupLng,
            dropoffAddress: formData.dropoffAddress,
            dropoffLat: formData.dropoffLat,
            dropoffLng: formData.dropoffLng,
            notes: formData.notes || undefined,
            priority: parseInt(formData.priority),
            vanId: formData.vanId || undefined,
            skipAutoAssign: formData.skipAutoAssign,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create ride");
        }

        setMessage("Ride created successfully!");
        setFormData({
          riderName: "",
          riderPhone: "",
          membershipId: undefined,
          passengerCount: "1",
          pickupAddress: "",
          pickupLat: undefined,
          pickupLng: undefined,
          dropoffAddress: "",
          dropoffLat: undefined,
          dropoffLng: undefined,
          notes: "",
          vanId: "",
          priority: "0",
          skipAutoAssign: false,
        });
      } catch {
        setMessage("Failed to create ride. Please try again.");
      }
    });
  };

  const availableVans = vans.filter((v) => v.status === "AVAILABLE" || v.status === "IN_USE");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rider Search - search accounts or manual entry */}
      <RiderSearch
        value={formData.riderName}
        phone={formData.riderPhone}
        onSelect={handleRiderSelect}
        onNameChange={(name) => setFormData(prev => ({ ...prev, riderName: name, membershipId: undefined }))}
        onPhoneChange={(phone) => setFormData(prev => ({ ...prev, riderPhone: phone }))}
        required
      />

      <div className="space-y-2">
        <Label htmlFor="pickupAddress">Pickup Address *</Label>
        <AddressAutocomplete
          value={formData.pickupAddress}
          onChange={handlePickupChange}
          placeholder="Enter pickup address..."
          showCurrentLocation
        />
        {formData.pickupLat && formData.pickupLng && (
          <p className="text-xs text-muted-foreground">
            Coordinates: {formData.pickupLat.toFixed(5)}, {formData.pickupLng.toFixed(5)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dropoffAddress">Dropoff Address *</Label>
        <AddressAutocomplete
          value={formData.dropoffAddress}
          onChange={handleDropoffChange}
          placeholder="Enter dropoff address..."
        />
        {formData.dropoffLat && formData.dropoffLng && (
          <p className="text-xs text-muted-foreground">
            Coordinates: {formData.dropoffLat.toFixed(5)}, {formData.dropoffLng.toFixed(5)}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="passengerCount">Passengers</Label>
          <Select
            value={formData.passengerCount}
            onValueChange={(value: string) => setFormData({ ...formData, passengerCount: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: string) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Normal</SelectItem>
              <SelectItem value="1">Priority 1</SelectItem>
              <SelectItem value="2">Priority 2</SelectItem>
              <SelectItem value="3">Priority 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vanId">Assign Van</Label>
          <Select
            value={formData.vanId || "__unassigned__"}
            onValueChange={(value: string) => setFormData({ ...formData, vanId: value === "__unassigned__" ? "" : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select van..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__unassigned__">Unassigned</SelectItem>
              {availableVans.map((van) => (
                <SelectItem key={van.id} value={van.id}>
                  {van.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any special instructions..."
          rows={3}
        />
      </div>

      {showSkipAutoAssign && !formData.vanId && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Switch
            id="skipAutoAssign"
            checked={formData.skipAutoAssign}
            onCheckedChange={(checked) => setFormData({ ...formData, skipAutoAssign: checked })}
          />
          <div>
            <Label htmlFor="skipAutoAssign" className="cursor-pointer">
              Skip auto-assign
            </Label>
            <p className="text-xs text-muted-foreground">
              Keep ride in queue for manual assignment
            </p>
          </div>
        </div>
      )}

      {message && (
        <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Creating..." : "Create Ride"}
      </Button>
    </form>
  );
}
