import { getLogtoContext } from "@logto/next/server-actions";
import { NextRequest, NextResponse } from "next/server";
import { getLogtoConfig } from "@/lib/logto";

// Force runtime evaluation - env vars not available at build time on Render
export const dynamic = "force-dynamic";

// Helper to get API URL at request time
function getApiBaseUrl() {
  return process.env.API_URL || "https://api.staysafeos.com";
}

export async function POST(request: NextRequest) {
  try {
    const config = getLogtoConfig();
    const { isAuthenticated, accessToken, claims } = await getLogtoContext(config);

    // Debug: log auth context details
    console.log("[api/tenants] Auth context:", {
      isAuthenticated,
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken?.length,
      hasClaims: !!claims,
      claimsSub: claims?.sub,
    });

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Please sign in to create an organization" },
        { status: 401 }
      );
    }

    // If no access token but authenticated, we need to use ID token claims
    // This happens when LOGTO_API_RESOURCE isn't configured
    if (!accessToken) {
      console.warn("[api/tenants] No access token available - check logs above for LOGTO_API_RESOURCE value");
      return NextResponse.json(
        { message: "API access not configured. Please contact support." },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Forward to API
    const response = await fetch(`${getApiBaseUrl()}/v1/tenants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to create organization" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/tenants] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
