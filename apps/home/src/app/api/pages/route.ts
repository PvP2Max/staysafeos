import { getLogtoContext } from "@logto/next/server-actions";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getLogtoConfig, getApiAccessToken } from "@/lib/logto";

// Force runtime evaluation
export const dynamic = "force-dynamic";

function getApiBaseUrl() {
  return process.env.API_URL || "https://api.staysafeos.com";
}

/**
 * Get the organization ID - first check cookie, then fall back to API
 */
async function getOrganizationId(accessToken: string): Promise<string | undefined> {
  // Check for selected org in cookie first
  const cookieStore = await cookies();
  const selectedOrgId = cookieStore.get("staysafeos_current_org")?.value;

  if (selectedOrgId) {
    return selectedOrgId;
  }

  // Fall back to fetching from API
  try {
    const response = await fetch(`${getApiBaseUrl()}/v1/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
    if (response.ok) {
      const me = await response.json();
      const ownedTenants = me.ownedTenants as Array<{ id: string }> | undefined;
      const membership = me.membership as { tenantId: string } | undefined;
      return ownedTenants?.[0]?.id || membership?.tenantId;
    }
  } catch {
    // Fall through
  }
  return undefined;
}

/**
 * GET /api/pages - List pages for current organization
 */
export async function GET() {
  try {
    const { isAuthenticated } = await getLogtoContext(getLogtoConfig());

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const accessToken = await getApiAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { message: "Could not get API access token" },
        { status: 503 }
      );
    }

    const organizationId = await getOrganizationId(accessToken);

    // Build headers
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    if (organizationId) {
      headers["X-StaySafe-Tenant"] = organizationId;
    }

    // Call the API
    const response = await fetch(`${getApiBaseUrl()}/v1/pages`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || "Failed to fetch pages" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/pages] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
