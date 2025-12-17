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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@staysafeos/ui";
import Link from "next/link";

export default function WalkOnPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    riderName: "",
    riderPhone: "",
    passengerCount: "1",
    pickupAddress: "",
    dropoffAddress: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/driver/walk-on", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            passengerCount: parseInt(formData.passengerCount),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create walk-on ride");
        }

        setMessage("Walk-on ride created!");
        setTimeout(() => router.push("/driver"), 1500);
      } catch {
        setMessage("Failed to create ride. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/driver" className="text-xl font-bold text-primary">
            &larr; Back
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Walk-On Ride</CardTitle>
            <CardDescription>
              Create a ride for someone who approached the van directly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="pickupAddress">Pickup Address *</Label>
                <Input
                  id="pickupAddress"
                  value={formData.pickupAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, pickupAddress: e.target.value })}
                  placeholder="Current location or nearby address"
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
                <p className={`text-sm ${message.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
                  {message}
                </p>
              )}

              <Button type="submit" disabled={isPending} className="w-full" size="lg">
                {isPending ? "Creating..." : "Create Walk-On Ride"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
