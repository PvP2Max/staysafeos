"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
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
import { IDScanner } from "@/components/id-scanner";
import { RiderSearch, type RiderSelection } from "@/components/rider-search";
import type { AAMVAData } from "@/lib/parse-aamva";

interface RecentAddress {
  address: string;
  type: "PICKUP" | "DROPOFF";
}

export default function WalkOnPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [recentAddresses, setRecentAddresses] = useState<RecentAddress[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Use refs for address inputs to prevent keyboard dismissal
  const pickupRef = useRef<HTMLInputElement>(null);
  const dropoffRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    riderName: "",
    riderPhone: "",
    membershipId: undefined as string | undefined,
    passengerCount: "1",
    pickupAddress: "",
    pickupLat: undefined as number | undefined,
    pickupLng: undefined as number | undefined,
    dropoffAddress: "",
    notes: "",
  });

  // Fetch recent addresses from van's tasks
  useEffect(() => {
    async function fetchRecentAddresses() {
      try {
        const response = await fetch("/api/driver/tasks?includeCompleted=true&limit=10");
        if (response.ok) {
          const tasks = await response.json();
          // Get unique pickup addresses from recent tasks
          const addresses: RecentAddress[] = [];
          const seen = new Set<string>();

          for (const task of tasks) {
            if (task.type === "PICKUP" && task.address && !seen.has(task.address)) {
              seen.add(task.address);
              addresses.push({ address: task.address, type: "PICKUP" });
              if (addresses.length >= 3) break;
            }
          }
          setRecentAddresses(addresses);
        }
      } catch {
        // Ignore errors - recent addresses are optional
      }
    }
    fetchRecentAddresses();
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get address
        try {
          const response = await fetch(`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`);
          if (response.ok) {
            const data = await response.json();
            const address = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            setFormData(prev => ({
              ...prev,
              pickupAddress: address,
              pickupLat: latitude,
              pickupLng: longitude,
            }));
          }
        } catch {
          // Use coordinates if geocoding fails
          const address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setFormData(prev => ({
            ...prev,
            pickupAddress: address,
            pickupLat: latitude,
            pickupLng: longitude,
          }));
        }
        setLoadingLocation(false);
      },
      () => {
        setMessage("Unable to get your location");
        setLoadingLocation(false);
      }
    );
  }, []);

  const selectRecentAddress = (address: string) => {
    setFormData(prev => ({ ...prev, pickupAddress: address }));
  };

  const handleRiderSelect = (rider: RiderSelection) => {
    setFormData(prev => ({
      ...prev,
      riderName: rider.name,
      riderPhone: rider.phone,
      membershipId: rider.membershipId,
      // If rider has a home address, offer it as dropoff
      dropoffAddress: rider.homeAddress || prev.dropoffAddress,
    }));
  };

  const handleIDScan = (data: AAMVAData) => {
    setShowScanner(false);
    setFormData(prev => ({
      ...prev,
      riderName: data.fullName || `${data.firstName} ${data.lastName}`.trim(),
      dropoffAddress: data.fullAddress || prev.dropoffAddress,
      membershipId: undefined, // Clear any linked account when scanning ID
    }));
    setMessage("ID scanned successfully!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/driver/walk-on", {
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
            notes: formData.notes || undefined,
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
      {/* ID Scanner Modal */}
      {showScanner && (
        <IDScanner
          onScan={handleIDScan}
          onClose={() => setShowScanner(false)}
        />
      )}

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
              {/* Scan ID Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowScanner(true)}
                className="w-full"
              >
                Scan ID Card
              </Button>

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

                {/* Quick select buttons */}
                <div className="flex flex-wrap gap-2 mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={loadingLocation}
                  >
                    {loadingLocation ? "Getting location..." : "📍 Current Location"}
                  </Button>
                  {recentAddresses.map((addr, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => selectRecentAddress(addr.address)}
                      className="max-w-[200px] truncate"
                    >
                      {addr.address.slice(0, 25)}...
                    </Button>
                  ))}
                </div>

                {recentAddresses.length > 0 && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Recent pickup locations shown above
                  </p>
                )}

                <Input
                  ref={pickupRef}
                  id="pickupAddress"
                  value={formData.pickupAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, pickupAddress: value, pickupLat: undefined, pickupLng: undefined }));
                  }}
                  placeholder="Enter pickup address or use buttons above"
                  required
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dropoffAddress">Dropoff Address *</Label>
                <Input
                  ref={dropoffRef}
                  id="dropoffAddress"
                  value={formData.dropoffAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, dropoffAddress: value }));
                  }}
                  required
                  autoComplete="off"
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
