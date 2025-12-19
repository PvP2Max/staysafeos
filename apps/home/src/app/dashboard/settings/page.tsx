import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { ProfileForm } from "./profile-form";

export const metadata = {
  title: "Settings | StaySafeOS",
  description: "Manage your account settings",
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
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and account preferences
        </p>
      </div>

      <ProfileForm initialData={profileData} />
    </div>
  );
}
