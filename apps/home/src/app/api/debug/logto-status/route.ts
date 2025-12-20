import { NextResponse } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { getLogtoConfig, getApiAccessToken } from "@/lib/logto";

export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL || "https://api.staysafeos.com";

async function getUserTenantSlug(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/v1/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.ownedTenants?.[0]?.slug || data.memberships?.[0]?.organization?.slug || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const { isAuthenticated } = await getLogtoContext(getLogtoConfig());

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const accessToken = await getApiAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: "No access token" }, { status: 401 });
    }

    // Get user's tenant slug for organization context
    const tenantSlug = await getUserTenantSlug(accessToken);
    if (!tenantSlug) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const response = await fetch(`${API_URL}/v1/domains/debug/logto-status`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-StaySafe-Tenant": tenantSlug,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[debug/logto-status] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
