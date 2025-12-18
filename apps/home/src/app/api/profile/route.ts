import { getLogtoContext } from "@logto/next/server-actions";
import { NextRequest, NextResponse } from "next/server";
import { logtoConfig } from "@/lib/logto";

const API_BASE_URL = process.env.API_URL || "https://api.staysafeos.com";

export async function PATCH(request: NextRequest) {
  try {
    const { isAuthenticated, accessToken } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Please sign in to update your profile" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!accessToken) {
      // If no access token, we can't update the API
      // Just return success since Logto profile is managed separately
      return NextResponse.json({ success: true });
    }

    // Forward to API
    const response = await fetch(`${API_BASE_URL}/v1/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
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
