"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
} from "@staysafeos/ui";
import { Send, MapPin, Phone, User, Users } from "lucide-react";

export default function RequestRidePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    riderName: "",
    riderPhone: "",
    passengerCount: 1,
    pickupAddress: "",
    dropoffAddress: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/rides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to submit ride request");
        }

        setSuccess(true);
        // Reset form
        setFormData({
          riderName: "",
          riderPhone: "",
          passengerCount: 1,
          pickupAddress: "",
          dropoffAddress: "",
          notes: "",
        });

        // Redirect after short delay
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit ride request");
      }
    });
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <Send className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Ride Requested!</h2>
              <p className="text-muted-foreground">
                Your ride request has been submitted. A dispatcher will assign a van shortly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Request a Ride
          </CardTitle>
          <CardDescription>
            Fill out the form below to request a safe ride home.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="riderName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Name
              </Label>
              <Input
                id="riderName"
                placeholder="John Doe"
                value={formData.riderName}
                onChange={(e) => setFormData({ ...formData, riderName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="riderPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="riderPhone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.riderPhone}
                onChange={(e) => setFormData({ ...formData, riderPhone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passengerCount" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of Passengers
              </Label>
              <Input
                id="passengerCount"
                type="number"
                min="1"
                max="10"
                value={formData.passengerCount}
                onChange={(e) => setFormData({ ...formData, passengerCount: parseInt(e.target.value) || 1 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupAddress" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                Pickup Location
              </Label>
              <Input
                id="pickupAddress"
                placeholder="123 Main St, Building A"
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dropoffAddress" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-600" />
                Dropoff Location
              </Label>
              <Input
                id="dropoffAddress"
                placeholder="456 Oak Ave, Apt 2"
                value={formData.dropoffAddress}
                onChange={(e) => setFormData({ ...formData, dropoffAddress: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Submitting..." : "Request Ride"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
