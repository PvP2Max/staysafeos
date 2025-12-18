import { getLogtoContext } from "@logto/next/server-actions";
import { NextRequest, NextResponse } from "next/server";
import { getLogtoConfig, getApiAccessToken } from "@/lib/logto";

// Force runtime evaluation - env vars not available at build time on Render
export const dynamic = "force-dynamic";

// Helper to get API URL at request time
function getApiBaseUrl() {
  return process.env.API_URL || "https://api.staysafeos.com";
}

export async function POST(request: NextRequest) {
  try {
    const config = getLogtoConfig();
    const { isAuthenticated } = await getLogtoContext(config);

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Please sign in to create an organization" },
        { status: 401 }
      );
    }

    // Get access token for the API resource
    const accessToken = await getApiAccessToken();

    if (!accessToken) {
      console.warn("[api/tenants] No access token available for API resource");
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
