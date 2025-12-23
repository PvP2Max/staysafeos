import { getLogtoContext, signOut } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getLogtoConfig, getApiAccessToken } from "@/lib/logto";
import { createApiClient } from "@/lib/api/client";
import { getTenantFromRequest } from "@/lib/tenant";
import { DashboardShell } from "@/components/navigation";
import { ProfileCompletionWrapper } from "@/components/profile-completion-wrapper";

// Prevent all caching - always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const API_URL = process.env.API_URL || "https://api.staysafeos.com";

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

  // Get auth data directly here to avoid race conditions
  const accessToken = await getApiAccessToken();
  const tenantSlug = await getTenantFromRequest();

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
    // Make direct API call like the debug endpoint does
    // This avoids race conditions with the ApiClient class
    if (accessToken && tenantSlug) {
      const statusResponse = await fetch(`${API_URL}/v1/me/membership-status`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-StaySafe-Tenant": tenantSlug,
        },
        cache: "no-store",
      });

      if (statusResponse.ok) {
        const status = await statusResponse.json();
        console.log("[dashboard/layout] Membership status:", JSON.stringify(status));
        if (status.hasAccount && !status.hasMembership) {
          redirect("/no-membership");
        }
        role = status.role;
        console.log("[dashboard/layout] Role set to:", role);
      } else {
        console.error("[dashboard/layout] Failed to get membership status:", statusResponse.status);
      }
    } else {
      console.warn("[dashboard/layout] Missing accessToken or tenantSlug", {
        hasToken: !!accessToken,
        tenantSlug
      });
    }

    // Create API client for remaining calls
    const api = await createApiClient();

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
