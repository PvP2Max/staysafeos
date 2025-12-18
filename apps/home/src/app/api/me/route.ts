import { getLogtoContext } from "@logto/next/server-actions";
import { NextResponse } from "next/server";
import { getLogtoConfig, getApiAccessToken } from "@/lib/logto";

// Force runtime evaluation
export const dynamic = "force-dynamic";

function getApiBaseUrl() {
  return process.env.API_URL || "https://api.staysafeos.com";
}

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

    // Call the API
    const response = await fetch(`${getApiBaseUrl()}/v1/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || "Failed to fetch user data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/me] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
