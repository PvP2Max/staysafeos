import { getLogtoContext } from "@logto/next/server-actions";
import { headers } from "next/headers";
import { logtoConfig } from "@/lib/logto";
import { ProfileForm } from "./profile-form";

export const metadata = {
  title: "Settings | StaySafeOS",
  description: "Manage your account settings",
};

async function fetchProfile() {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const cookie = headersList.get("cookie") || "";

    const response = await fetch(`${protocol}://${host}/api/me`, {
      headers: { cookie },
      cache: "no-store",
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const [{ claims }, apiProfile] = await Promise.all([
    getLogtoContext(logtoConfig),
    fetchProfile(),
  ]);

  // Combine API data with Logto claims (API takes precedence for name)
  const firstName = apiProfile?.account?.firstName;
  const lastName = apiProfile?.account?.lastName;
  const apiName = firstName
    ? lastName
      ? `${firstName} ${lastName}`
      : firstName
    : null;

  const profileData = {
    name: apiName || (claims?.name as string | undefined),
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
