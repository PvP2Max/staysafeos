"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Switch,
  Label,
} from "@staysafeos/ui";

interface OrgSettingsDialogProps {
  organizationId: string;
  organizationName: string;
  trigger?: React.ReactNode;
}

const FEATURE_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  rideRequests: {
    label: "Ride Requests",
    description: "Allow riders to submit ride requests through the app",
  },
  walkOns: {
    label: "Walk-On Rides",
    description: "Allow drivers to create walk-on rides for people who approach the van directly",
  },
  tcTransfers: {
    label: "TC Transfers",
    description: "Allow TCs to request transfers to other volunteers",
  },
  training: {
    label: "Training System",
    description: "Enable the training module system with videos and quizzes",
  },
  shifts: {
    label: "Shift Management",
    description: "Enable shift scheduling and volunteer sign-ups",
  },
  analytics: {
    label: "Analytics Dashboard",
    description: "Show analytics and reporting features",
  },
  supportCodes: {
    label: "Support Codes",
    description: "Allow creation of support codes for role elevation",
  },
};

export function OrgSettingsDialog({ organizationId, organizationName, trigger }: OrgSettingsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch features when dialog opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      setError("");
      fetch(`/api/organizations/${organizationId}/features`)
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Failed to load settings");
          }
          return res.json();
        })
        .then((data) => {
          setFeatures(data.features || {});
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, organizationId]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setMessage("");
      setError("");
    }
  }, [open]);

  const handleToggle = (key: string, value: boolean): void => {
    setFeatures((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setMessage("");
    setError("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}/features`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(features),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to save settings");
        }

        setMessage("Settings saved successfully!");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save settings");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </span>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Settings
        </Button>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Organization Settings</DialogTitle>
          <DialogDescription>
            Configure features for {organizationName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading settings...
          </div>
        ) : error && !Object.keys(features).length ? (
          <div className="py-8 text-center text-red-600">
            {error}
          </div>
        ) : (
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {Object.entries(FEATURE_DESCRIPTIONS).map(([key, { label, description }]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor={`feature-${key}`} className="text-base cursor-pointer">
                    {label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Switch
                  id={`feature-${key}`}
                  checked={features[key] ?? true}
                  onCheckedChange={(value: boolean) => handleToggle(key, value)}
                  disabled={isPending}
                />
              </div>
            ))}
          </div>
        )}

        {(message || error) && (
          <p className={`text-sm ${message ? "text-green-600" : "text-red-600"}`}>
            {message || error}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || loading}>
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
