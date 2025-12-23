import { signOut } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getLogtoConfig } from "@/lib/logto";
import { DashboardShell } from "@/components/navigation";
import { ProfileCompletionWrapper } from "@/components/profile-completion-wrapper";

// Prevent all caching - always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Call internal Route Handler to get session data
  // Route Handlers work reliably with Logto session, Server Components don't
  const headersList = await headers();
  const host = headersList.get("host") || "app.staysafeos.com";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const cookieHeader = headersList.get("cookie") || "";

  const sessionResponse = await fetch(`${protocol}://${host}/api/internal/session-data`, {
    headers: {
      cookie: cookieHeader,
    },
    cache: "no-store",
  });

  const sessionData = await sessionResponse.json();
  console.log("[dashboard/layout] Session data:", JSON.stringify(sessionData));

  if (!sessionData.authenticated) {
    redirect("/");
  }

  // Check membership
  if (sessionData.status?.hasAccount && !sessionData.status?.hasMembership) {
    redirect("/no-membership");
  }

  const role = sessionData.status?.role || null;
  const onShiftRoles = sessionData.onShiftRoles || [];

  const user = {
    email: sessionData.profile?.account?.email || sessionData.claims?.email || "",
    firstName: sessionData.profile?.account?.firstName,
    lastName: sessionData.profile?.account?.lastName,
    phone: sessionData.profile?.account?.phone,
    rank: sessionData.profile?.account?.rank,
    unit: sessionData.profile?.account?.unit,
    homeAddress: sessionData.profile?.account?.homeAddress,
    homeLat: sessionData.profile?.account?.homeLat,
    homeLng: sessionData.profile?.account?.homeLng,
  };

  const theme = sessionData.theme || undefined;

  const profileCompletion = sessionData.profileCompletion || {
    isComplete: true,
    missingFields: [],
    requiredFields: { rank: false, org: false, home: false },
    account: {},
  };

  async function handleSignOut() {
    "use server";
    const config = await getLogtoConfig();
    await signOut(config);
  }

  const logtoEndpoint = process.env.LOGTO_ENDPOINT || "https://auth.staysafeos.com";

  return (
    <DashboardShell
      user={user}
      role={role}
      onShiftRoles={onShiftRoles}
      signOutAction={handleSignOut}
      theme={theme}
      logtoEndpoint={logtoEndpoint}
    >
      <ProfileCompletionWrapper initialData={profileCompletion}>
        {children}
      </ProfileCompletionWrapper>
    </DashboardShell>
  );
}
