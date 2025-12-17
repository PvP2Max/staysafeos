"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Switch,
  Label,
} from "@staysafeos/ui";
import { updateFeatures } from "@/lib/api/actions";

interface SettingsFormProps {
  initialFeatures: Record<string, boolean>;
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

export function SettingsForm({ initialFeatures }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [features, setFeatures] = useState(initialFeatures);
  const [message, setMessage] = useState("");

  const handleToggle = (key: string, value: boolean): void => {
    setFeatures((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setMessage("");
    startTransition(async () => {
      try {
        await updateFeatures(features);
        setMessage("Settings saved successfully!");
      } catch {
        setMessage("Failed to save settings");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Toggles</CardTitle>
          <CardDescription>
            Enable or disable features for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(FEATURE_DESCRIPTIONS).map(([key, { label, description }]) => (
            <div key={key} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={key} className="text-base">
                  {label}
                </Label>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <Switch
                id={key}
                checked={features[key] ?? true}
                onCheckedChange={(value: boolean) => handleToggle(key, value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
        {message && (
          <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
