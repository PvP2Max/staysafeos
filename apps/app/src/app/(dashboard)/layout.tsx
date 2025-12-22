import { getLogtoContext, signOut } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { getLogtoConfig } from "@/lib/logto";
import { createApiClient } from "@/lib/api/client";
import { getTenantFromRequest } from "@/lib/tenant";
import { DashboardShell } from "@/components/navigation";
import { ProfileCompletionWrapper } from "@/components/profile-completion-wrapper";

// Prevent caching - always fetch fresh data
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logtoConfig = await getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated) {
    redirect("/");
  }

  // Fetch user data and membership status
  let role: string | null = null;
  let onShiftRoles: string[] = [];
  let user = {
    email: claims?.email as string || "",
    firstName: undefined as string | undefined,
    lastName: undefined as string | undefined,
    phone: undefined as string | undefined,
    rank: undefined as string | undefined,
    unit: undefined as string | undefined,
    homeAddress: undefined as string | undefined,
    homeLat: undefined as number | undefined,
    homeLng: undefined as number | undefined,
  };

  // Profile completion data
  let profileCompletion: {
    isComplete: boolean;
    missingFields: string[];
    requiredFields: { rank: boolean; org: boolean; home: boolean };
    account: {
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      rank?: string | null;
      unit?: string | null;
      homeAddress?: string | null;
      homeLat?: number | null;
      homeLng?: number | null;
    };
  } | null = null;

  // Theme data for custom logos
  let theme: {
    logoUrl?: string | null;
    faviconUrl?: string | null;
  } | undefined = undefined;

  try {
    const api = await createApiClient();

    // Check membership status
    const status = await api.getMembershipStatus();
    console.log("[dashboard/layout] Membership status:", JSON.stringify(status));
    if (status.hasAccount && !status.hasMembership) {
      redirect("/no-membership");
    }
    role = status.role;
    console.log("[dashboard/layout] Role set to:", role);

    // Get user profile
    try {
      const profile = await api.getMe();
      if (profile.account) {
        user = {
          email: profile.account.email,
          firstName: profile.account.firstName,
          lastName: profile.account.lastName,
          phone: profile.account.phone,
          rank: profile.account.rank,
          unit: profile.account.unit,
          homeAddress: profile.account.homeAddress,
          homeLat: profile.account.homeLat,
          homeLng: profile.account.homeLng,
        };
      }
    } catch {
      // Profile fetch failed, use claims data
    }

    // Get profile completion status
    try {
      profileCompletion = await api.getProfileCompletion();
    } catch {
      // Profile completion check failed, assume complete to not block
      profileCompletion = {
        isComplete: true,
        missingFields: [],
        requiredFields: { rank: false, org: false, home: false },
        account: {},
      };
    }

    // Get on-shift status
    try {
      const shiftStatus = await api.getOnShiftStatus();
      onShiftRoles = Object.keys(shiftStatus.roles).filter(
        (r) => shiftStatus.roles[r]
      );
    } catch {
      // On-shift check failed, continue without shift data
    }

    // Get tenant theme for custom logos
    try {
      const tenantSlug = await getTenantFromRequest();
      if (tenantSlug) {
        const themeData = await api.getTheme(tenantSlug);
        theme = {
          logoUrl: themeData.logoUrl,
          faviconUrl: themeData.faviconUrl,
        };
      }
    } catch {
      // Theme fetch failed, continue with default branding
    }
  } catch (error) {
    // If API calls fail, continue with defaults
    console.error("[dashboard/layout] API error:", error);
  }

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
