import { getLogtoContext } from "@logto/next/server-actions";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getLogtoConfig, getApiAccessToken } from "@/lib/logto";

export const dynamic = "force-dynamic";

function getApiBaseUrl() {
  return process.env.API_URL || "https://api.staysafeos.com";
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscriptionTier?: string;
  role?: string;
}

/**
 * GET /api/organizations - Get all organizations for the current user
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

    // Fetch user info from API
    const response = await fetch(`${getApiBaseUrl()}/v1/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to fetch user info" },
        { status: response.status }
      );
    }

    const me = await response.json();

    // Combine owned tenants and membership tenant into a single list
    const organizations: Organization[] = [];

    // Add owned tenants (user is owner)
    const ownedTenants = me.ownedTenants as Array<{
      id: string;
      name: string;
      slug: string;
      subscriptionTier: string;
    }> | undefined;

    if (ownedTenants) {
      for (const tenant of ownedTenants) {
        organizations.push({
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          subscriptionTier: tenant.subscriptionTier,
          role: "owner",
        });
      }
    }

    // Add membership tenant if not already in list
    const membership = me.membership as {
      tenantId: string;
      role: string;
      tenant?: { id: string; name: string; slug: string };
    } | undefined;

    if (membership?.tenant) {
      const alreadyInList = organizations.some(org => org.id === membership.tenant!.id);
      if (!alreadyInList) {
        organizations.push({
          id: membership.tenant.id,
          name: membership.tenant.name,
          slug: membership.tenant.slug,
          role: membership.role,
        });
      }
    }

    // Get current selected org from cookie
    const cookieStore = await cookies();
    const currentOrgId = cookieStore.get("staysafeos_current_org")?.value;

    return NextResponse.json({
      organizations,
      currentOrganizationId: currentOrgId || organizations[0]?.id,
    });
  } catch (error) {
    console.error("[api/organizations] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
