import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { createApiClient } from "@/lib/api/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@staysafeos/ui";
import { SettingsForm } from "./settings-form";
import { ProfileForm } from "./profile-form";

export const metadata = {
  title: "Settings | StaySafeOS",
  description: "Manage your profile and organization settings",
};

export default async function SettingsPage() {
  const { claims } = await getLogtoContext(logtoConfig);

  // Default profile data from Logto claims
  const profileData = {
    name: claims?.name as string | undefined,
    email: claims?.email as string | undefined,
    avatarUrl: claims?.picture as string | undefined,
  };

  // Default feature settings
  let features: Record<string, boolean> = {
    rideRequests: true,
    walkOns: true,
    tcTransfers: true,
    training: true,
    shifts: true,
    analytics: true,
    supportCodes: true,
  };

  let hasOrganization = false;

  try {
    const api = await createApiClient();
    const tenant = await api.getTenant();
    hasOrganization = true;
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
    // User may not have an organization yet
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and organization preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm initialData={profileData} />
        </TabsContent>

        <TabsContent value="organization">
          {hasOrganization ? (
            <SettingsForm initialFeatures={features} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>You need to create or join an organization to access these settings.</p>
              <a href="/dashboard/organizations" className="text-primary underline mt-2 inline-block">
                Go to Organizations
              </a>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
