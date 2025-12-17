import { getLogtoContext } from "@logto/next/server-actions";
import { NextRequest, NextResponse } from "next/server";
import { logtoConfig } from "@/lib/logto";

const API_BASE_URL = process.env.API_URL || "https://api.staysafeos.com";

export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated, accessToken } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated || !accessToken) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Forward to API
    const response = await fetch(`${API_BASE_URL}/v1/tenants`, {
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
