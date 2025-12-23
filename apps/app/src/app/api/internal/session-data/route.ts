import { NextResponse } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { getLogtoConfig, getApiAccessToken } from "@/lib/logto";
import { getTenantFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL || "https://api.staysafeos.com";

/**
 * Internal endpoint to get session data for the dashboard layout.
 * Route Handlers work more reliably than Server Components for Logto session access.
 */
export async function GET() {
  try {
    const logtoConfig = await getLogtoConfig();
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated) {
      return NextResponse.json({ authenticated: false });
    }

    const accessToken = await getApiAccessToken();
    const tenantSlug = await getTenantFromRequest();

    if (!accessToken || !tenantSlug) {
      return NextResponse.json({
        authenticated: true,
        error: "Missing token or tenant",
        hasToken: !!accessToken,
        tenantSlug,
      });
    }

    // Fetch membership status
    const statusResponse = await fetch(`${API_URL}/v1/me/membership-status`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-StaySafe-Tenant": tenantSlug,
      },
      cache: "no-store",
    });

    if (!statusResponse.ok) {
      return NextResponse.json({
        authenticated: true,
        error: `API returned ${statusResponse.status}`,
      });
    }

    const status = await statusResponse.json();

    // Fetch user profile
    let profile = null;
    try {
      const profileResponse = await fetch(`${API_URL}/v1/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-StaySafe-Tenant": tenantSlug,
        },
        cache: "no-store",
      });
      if (profileResponse.ok) {
        profile = await profileResponse.json();
      }
    } catch {
      // Profile fetch failed
    }

    // Fetch on-shift status
    let onShiftRoles: string[] = [];
    try {
      const shiftResponse = await fetch(`${API_URL}/v1/me/on-shift`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-StaySafe-Tenant": tenantSlug,
        },
        cache: "no-store",
      });
      if (shiftResponse.ok) {
        const shiftData = await shiftResponse.json();
        onShiftRoles = Object.keys(shiftData.roles || {}).filter(
          (r) => shiftData.roles[r]
        );
      }
    } catch {
      // On-shift fetch failed
    }

    // Fetch theme
    let theme = null;
    try {
      const themeResponse = await fetch(`${API_URL}/v1/theming/org/${tenantSlug}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-StaySafe-Tenant": tenantSlug,
        },
        cache: "no-store",
      });
      if (themeResponse.ok) {
        const themeData = await themeResponse.json();
        theme = {
          logoUrl: themeData.logoUrl,
          faviconUrl: themeData.faviconUrl,
        };
      }
    } catch {
      // Theme fetch failed
    }

    // Fetch profile completion
    let profileCompletion = null;
    try {
      const completionResponse = await fetch(`${API_URL}/v1/me/profile-completion`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-StaySafe-Tenant": tenantSlug,
        },
        cache: "no-store",
      });
      if (completionResponse.ok) {
        profileCompletion = await completionResponse.json();
      }
    } catch {
      // Completion fetch failed
    }

    return NextResponse.json({
      authenticated: true,
      claims: {
        email: claims?.email,
        sub: claims?.sub,
      },
      status,
      profile,
      onShiftRoles,
      theme,
      profileCompletion,
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
