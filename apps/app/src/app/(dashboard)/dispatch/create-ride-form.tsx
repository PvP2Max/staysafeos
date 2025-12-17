"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@staysafeos/ui";

interface Van {
  id: string;
  name: string;
  status: string;
}

interface CreateRideFormProps {
  vans: Van[];
}

export function CreateRideForm({ vans }: CreateRideFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    riderName: "",
    riderPhone: "",
    passengerCount: "1",
    pickupAddress: "",
    dropoffAddress: "",
    notes: "",
    vanId: "",
    priority: "0",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/rides/manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            passengerCount: parseInt(formData.passengerCount),
            priority: parseInt(formData.priority),
            vanId: formData.vanId || undefined,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create ride");
        }

        setMessage("Ride created successfully!");
        setFormData({
          riderName: "",
          riderPhone: "",
          passengerCount: "1",
          pickupAddress: "",
          dropoffAddress: "",
          notes: "",
          vanId: "",
          priority: "0",
        });
      } catch {
        setMessage("Failed to create ride. Please try again.");
      }
    });
  };

  const availableVans = vans.filter((v) => v.status === "AVAILABLE" || v.status === "IN_USE");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="riderName">Rider Name *</Label>
          <Input
            id="riderName"
            value={formData.riderName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, riderName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="riderPhone">Phone *</Label>
          <Input
            id="riderPhone"
            type="tel"
            value={formData.riderPhone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, riderPhone: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pickupAddress">Pickup Address *</Label>
        <Input
          id="pickupAddress"
          value={formData.pickupAddress}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, pickupAddress: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dropoffAddress">Dropoff Address *</Label>
        <Input
          id="dropoffAddress"
          value={formData.dropoffAddress}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, dropoffAddress: e.target.value })}
          required
        />
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
            value={formData.vanId}
            onValueChange={(value: string) => setFormData({ ...formData, vanId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select van..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
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
