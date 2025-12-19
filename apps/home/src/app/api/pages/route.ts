import { getLogtoContext } from "@logto/next/server-actions";
import { NextResponse } from "next/server";
import { getLogtoConfig, getApiAccessToken } from "@/lib/logto";

// Force runtime evaluation
export const dynamic = "force-dynamic";

function getApiBaseUrl() {
  return process.env.API_URL || "https://api.staysafeos.com";
}

/**
 * Get the organization ID from Logto context
 */
async function getOrganizationId(): Promise<string | undefined> {
  try {
    const config = getLogtoConfig();
    const { claims } = await getLogtoContext(config);
    const organizations = claims?.organizations as string[] | undefined;
    return organizations?.[0];
  } catch {
    return undefined;
  }
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
    const organizationId = await getOrganizationId();

    if (!accessToken) {
      return NextResponse.json(
        { message: "Could not get API access token" },
        { status: 503 }
      );
    }

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
