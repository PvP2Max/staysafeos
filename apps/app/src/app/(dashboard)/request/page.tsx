"use client";

import { useState, useTransition, useEffect } from "react";
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
import { Send, Phone, User, Users } from "lucide-react";
import { AddressAutocomplete } from "@/components/address-autocomplete";

interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  homeAddress?: string;
  homeLat?: number;
  homeLng?: number;
}

export default function RequestRidePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({
    riderName: "",
    riderPhone: "",
    passengerCount: 1,
    pickupAddress: "",
    pickupLat: undefined as number | undefined,
    pickupLng: undefined as number | undefined,
    dropoffAddress: "",
    dropoffLat: undefined as number | undefined,
    dropoffLng: undefined as number | undefined,
    notes: "",
  });

  // Fetch user profile for home address and pre-fill name/phone
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/me");
        if (response.ok) {
          const data = await response.json();
          if (data.account) {
            setUserProfile({
              firstName: data.account.firstName,
              lastName: data.account.lastName,
              phone: data.account.phone,
              homeAddress: data.account.homeAddress,
              homeLat: data.account.homeLat,
              homeLng: data.account.homeLng,
            });

            // Pre-fill form with user data
            const name = [data.account.firstName, data.account.lastName]
              .filter(Boolean)
              .join(" ");
            setFormData((prev) => ({
              ...prev,
              riderName: name || prev.riderName,
              riderPhone: data.account.phone || prev.riderPhone,
            }));
          }
        }
      } catch {
        // Failed to fetch profile, continue without it
      }
    }
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/rides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            riderName: formData.riderName,
            riderPhone: formData.riderPhone,
            passengerCount: formData.passengerCount,
            pickupAddress: formData.pickupAddress,
            pickupLat: formData.pickupLat,
            pickupLng: formData.pickupLng,
            dropoffAddress: formData.dropoffAddress,
            dropoffLat: formData.dropoffLat,
            dropoffLng: formData.dropoffLng,
            notes: formData.notes,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to submit ride request");
        }

        setSuccess(true);
        // Reset form (but keep name/phone from profile)
        setFormData((prev) => ({
          ...prev,
          passengerCount: 1,
          pickupAddress: "",
          pickupLat: undefined,
          pickupLng: undefined,
          dropoffAddress: "",
          dropoffLat: undefined,
          dropoffLng: undefined,
          notes: "",
        }));

        // Redirect after short delay
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit ride request");
      }
    });
  };

  const handlePickupChange = (address: string, lat?: number, lng?: number) => {
    setFormData((prev) => ({
      ...prev,
      pickupAddress: address,
      pickupLat: lat,
      pickupLng: lng,
    }));
  };

  const handleDropoffChange = (address: string, lat?: number, lng?: number) => {
    setFormData((prev) => ({
      ...prev,
      dropoffAddress: address,
      dropoffLat: lat,
      dropoffLng: lng,
    }));
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
              <Label className="flex items-center gap-2 text-green-600">
                Pickup Location
              </Label>
              <AddressAutocomplete
                value={formData.pickupAddress}
                onChange={handlePickupChange}
                placeholder="Enter pickup address..."
                showCurrentLocation
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-red-600">
                Dropoff Location
              </Label>
              <AddressAutocomplete
                value={formData.dropoffAddress}
                onChange={handleDropoffChange}
                placeholder="Enter dropoff address..."
                showHomeAddress={!!userProfile?.homeAddress}
                homeAddress={userProfile?.homeAddress ? {
                  address: userProfile.homeAddress,
                  lat: userProfile.homeLat,
                  lng: userProfile.homeLng,
                } : undefined}
                disabled={isPending}
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
