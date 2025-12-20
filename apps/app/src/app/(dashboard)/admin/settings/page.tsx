"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Switch,
  Label,
  Skeleton,
} from "@staysafeos/ui";
import { Settings, AlertCircle } from "lucide-react";

interface OrgSettings {
  organizationId: string;
  organizationName: string;
  rankRequired: boolean;
  orgRequired: boolean;
  homeRequired: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch settings");
      }
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof Pick<OrgSettings, "rankRequired" | "orgRequired" | "homeRequired">, value: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = () => {
    if (!settings) return;
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rankRequired: settings.rankRequired,
            orgRequired: settings.orgRequired,
            homeRequired: settings.homeRequired,
          }),
        });

        if (!response.ok) throw new Error("Failed to save settings");
        setMessage({ type: "success", text: "Settings saved successfully!" });
      } catch {
        setMessage({ type: "error", text: "Failed to save settings" });
      }
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </h1>
          <p className="text-muted-foreground">Loading organization settings...</p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-[150px]" />
                  <Skeleton className="h-4 w-[250px]" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </h1>
          <p className="text-muted-foreground">Organization settings</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <p className="font-medium">Failed to load settings</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={fetchSettings}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage organization settings for {settings?.organizationName || "your organization"}
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-500/10 text-green-600"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Required Profile Fields</CardTitle>
          <CardDescription>
            Require members to complete certain profile fields before they can use the app.
            New members will be prompted to fill these fields on first login.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="rankRequired" className="text-base font-medium">
                Require Rank
              </Label>
              <p className="text-sm text-muted-foreground">
                Members must provide their military rank (e.g., E-4, O-3)
              </p>
            </div>
            <Switch
              id="rankRequired"
              checked={settings?.rankRequired || false}
              onCheckedChange={(value) => handleToggle("rankRequired", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="orgRequired" className="text-base font-medium">
                Require Unit/Organization
              </Label>
              <p className="text-sm text-muted-foreground">
                Members must provide their unit or organization name
              </p>
            </div>
            <Switch
              id="orgRequired"
              checked={settings?.orgRequired || false}
              onCheckedChange={(value) => handleToggle("orgRequired", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="homeRequired" className="text-base font-medium">
                Require Home Address
              </Label>
              <p className="text-sm text-muted-foreground">
                Members must provide their home address for quick ride requests
              </p>
            </div>
            <Switch
              id="homeRequired"
              checked={settings?.homeRequired || false}
              onCheckedChange={(value) => handleToggle("homeRequired", value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
