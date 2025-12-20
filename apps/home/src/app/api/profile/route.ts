import { getLogtoContext } from "@logto/next/server-actions";
import { NextRequest, NextResponse } from "next/server";
import { getLogtoConfig, getApiAccessToken } from "@/lib/logto";

// Force runtime evaluation - env vars not available at build time on Render
export const dynamic = "force-dynamic";

// Helper to get API URL at request time
function getApiBaseUrl() {
  return process.env.API_URL || "https://api.staysafeos.com";
}

export async function PATCH(request: NextRequest) {
  try {
    const { isAuthenticated } = await getLogtoContext(getLogtoConfig());

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Please sign in to update your profile" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Transform 'name' field to firstName/lastName for API compatibility
    const apiBody: Record<string, unknown> = { ...body };
    if (body.name !== undefined) {
      const nameParts = (body.name as string).trim().split(/\s+/);
      apiBody.firstName = nameParts[0] || null;
      apiBody.lastName = nameParts.slice(1).join(" ") || null;
      delete apiBody.name;
    }

    // Get access token for the API resource
    const accessToken = await getApiAccessToken();

    if (!accessToken) {
      // If no access token, we can't update the API
      // Just return success since Logto profile is managed separately
      return NextResponse.json({ success: true });
    }

    // Forward to API using PUT (API uses @Put decorator)
    const response = await fetch(`${getApiBaseUrl()}/v1/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(apiBody),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to update profile" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/profile] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
