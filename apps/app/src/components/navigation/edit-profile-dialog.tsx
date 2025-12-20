"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Loader2 } from "lucide-react";
import { AddressAutocomplete } from "@/components/address-autocomplete";

// Common military ranks
const RANKS = [
  "PVT", "PV2", "PFC", "SPC", "CPL",
  "SGT", "SSG", "SFC", "MSG", "1SG", "SGM", "CSM", "SMA",
  "WO1", "CW2", "CW3", "CW4", "CW5",
  "2LT", "1LT", "CPT", "MAJ", "LTC", "COL",
  "BG", "MG", "LTG", "GEN",
  "CIV",
];

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    rank?: string;
    unit?: string;
    homeAddress?: string;
    homeLat?: number;
    homeLng?: number;
  };
}

export function EditProfileDialog({
  open,
  onOpenChange,
  initialData,
}: EditProfileDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: initialData.firstName || "",
    lastName: initialData.lastName || "",
    phone: initialData.phone || "",
    rank: initialData.rank || "",
    unit: initialData.unit || "",
    homeAddress: initialData.homeAddress || "",
    homeLat: initialData.homeLat as number | undefined,
    homeLng: initialData.homeLng as number | undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const response = await fetch("/api/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: formData.firstName.trim() || null,
            lastName: formData.lastName.trim() || null,
            phone: formData.phone.trim() || null,
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

        setSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
          router.refresh();
        }, 1000);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-md bg-green-100 text-green-800 text-sm">
              Profile updated successfully!
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rank">Rank</Label>
            <Select
              value={formData.rank || "__none__"}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, rank: value === "__none__" ? "" : value }))}
            >
              <SelectTrigger id="rank">
                <SelectValue placeholder="Select rank..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {RANKS.map((rank) => (
                  <SelectItem key={rank} value={rank}>
                    {rank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit/Organization</Label>
            <Input
              id="unit"
              value={formData.unit}
              onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
              placeholder="e.g., 1st Infantry Division"
            />
          </div>

          <div className="space-y-2">
            <Label>Home Address</Label>
            <AddressAutocomplete
              value={formData.homeAddress}
              onChange={handleAddressChange}
              placeholder="Enter your home address..."
            />
            <p className="text-xs text-muted-foreground">
              Used as a quick option when requesting rides
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
