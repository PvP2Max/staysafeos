import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@staysafeos/ui";
import { ProfileForm } from "./profile-form";
import Link from "next/link";

export const metadata = {
  title: "Settings | StaySafeOS",
  description: "Manage your profile settings",
};

export default async function SettingsPage() {
  const { claims } = await getLogtoContext(logtoConfig);

  // Default profile data from Logto claims
  const profileData = {
    name: claims?.name as string | undefined,
    email: claims?.email as string | undefined,
    avatarUrl: claims?.picture as string | undefined,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile settings
        </p>
      </div>

      <ProfileForm initialData={profileData} />

      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>
            Organization-specific settings are now managed from the Organizations page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To configure features, branding, and other organization settings, go to your{" "}
            <Link href="/dashboard/organizations" className="text-primary hover:underline">
              Organizations
            </Link>{" "}
            page and click the Settings button next to the organization you want to configure.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
