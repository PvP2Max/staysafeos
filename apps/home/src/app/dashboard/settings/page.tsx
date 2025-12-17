import { createApiClient } from "@/lib/api/client";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  let features: Record<string, boolean> = {
    rideRequests: true,
    walkOns: true,
    tcTransfers: true,
    training: true,
    shifts: true,
    analytics: true,
    supportCodes: true,
  };

  try {
    const api = await createApiClient();
    const tenant = await api.getTenant();
    features = {
      rideRequests: tenant.features?.rideRequests ?? true,
      walkOns: tenant.features?.walkOns ?? true,
      tcTransfers: tenant.features?.tcTransfers ?? true,
      training: tenant.features?.training ?? true,
      shifts: tenant.features?.shifts ?? true,
      analytics: tenant.features?.analytics ?? true,
      supportCodes: tenant.features?.supportCodes ?? true,
    };
  } catch {
    // Use defaults if API fails
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure features and preferences for your organization
        </p>
      </div>

      <SettingsForm initialFeatures={features} />
    </div>
  );
}
