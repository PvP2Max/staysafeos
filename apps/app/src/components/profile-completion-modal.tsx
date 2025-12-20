"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@staysafeos/ui";
import { User, Phone, Medal, Building, Home, Loader2, AlertCircle } from "lucide-react";
import { AddressAutocomplete } from "./address-autocomplete";

// Common military ranks
const RANKS = [
  // Enlisted
  "PVT", "PV2", "PFC", "SPC", "CPL",
  "SGT", "SSG", "SFC", "MSG", "1SG", "SGM", "CSM", "SMA",
  // Warrant Officers
  "WO1", "CW2", "CW3", "CW4", "CW5",
  // Officers
  "2LT", "1LT", "CPT", "MAJ", "LTC", "COL",
  "BG", "MG", "LTG", "GEN",
  // Civilian
  "CIV",
];

interface ProfileCompletionModalProps {
  open: boolean;
  missingFields: string[];
  requiredFields: {
    rank: boolean;
    org: boolean;
    home: boolean;
  };
  initialData: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    rank?: string | null;
    unit?: string | null;
    homeAddress?: string | null;
    homeLat?: number | null;
    homeLng?: number | null;
  };
  onComplete: () => void;
}

export function ProfileCompletionModal({
  open,
  missingFields,
  requiredFields,
  initialData,
  onComplete,
}: ProfileCompletionModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: initialData.firstName || "",
    lastName: initialData.lastName || "",
    phone: initialData.phone || "",
    rank: initialData.rank || "",
    unit: initialData.unit || "",
    homeAddress: initialData.homeAddress || "",
    homeLat: initialData.homeLat || undefined as number | undefined,
    homeLng: initialData.homeLng || undefined as number | undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First and last name are required");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return;
    }
    if (requiredFields.rank && !formData.rank) {
      setError("Rank is required");
      return;
    }
    if (requiredFields.org && !formData.unit.trim()) {
      setError("Unit/Organization is required");
      return;
    }
    if (requiredFields.home && !formData.homeAddress.trim()) {
      setError("Home address is required");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            phone: formData.phone.trim(),
            rank: formData.rank || null,
            unit: formData.unit.trim() || null,
            homeAddress: formData.homeAddress.trim() || null,
            homeLat: formData.homeLat,
            homeLng: formData.homeLng,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update profile");
        }

        onComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update profile");
      }
    });
  };

  const handleAddressChange = (address: string, lat?: number, lng?: number) => {
    setFormData((prev) => ({
      ...prev,
      homeAddress: address,
      homeLat: lat,
      homeLng: lng,
    }));
  };

  const showName = missingFields.includes("name");
  const showPhone = missingFields.includes("phone");
  const showRank = missingFields.includes("rank");
  const showUnit = missingFields.includes("unit");
  const showHome = missingFields.includes("homeAddress");

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Please complete the required information before continuing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Name fields - always show if missing */}
          {showName && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
          )}

          {/* Phone field - always show if missing */}
          {showPhone && (
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
                required
              />
            </div>
          )}

          {/* Rank field - show if required by org */}
          {showRank && (
            <div className="space-y-2">
              <Label htmlFor="rank" className="flex items-center gap-2">
                <Medal className="h-4 w-4" />
                Rank *
              </Label>
              <Select
                value={formData.rank}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, rank: value }))}
              >
                <SelectTrigger id="rank">
                  <SelectValue placeholder="Select rank..." />
                </SelectTrigger>
                <SelectContent>
                  {RANKS.map((rank) => (
                    <SelectItem key={rank} value={rank}>
                      {rank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Unit/Organization field - show if required by org */}
          {showUnit && (
            <div className="space-y-2">
              <Label htmlFor="unit" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Unit/Organization *
              </Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="e.g., 1st Infantry Division"
                required
              />
            </div>
          )}

          {/* Home Address field - show if required by org */}
          {showHome && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home Address *
              </Label>
              <AddressAutocomplete
                value={formData.homeAddress}
                onChange={handleAddressChange}
                placeholder="Enter your home address..."
              />
              <p className="text-xs text-muted-foreground">
                This will be used as a quick option when requesting rides.
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Profile"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
