import { NextResponse } from "next/server";
import { getApiAccessToken } from "@/lib/logto";
import { getTenantFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/**
 * Internal endpoint to get access token for SSE connection.
 * This allows client components to establish SSE connections with authentication.
 */
export async function GET() {
  try {
    const accessToken = await getApiAccessToken();
    const tenantSlug = await getTenantFromRequest();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      accessToken,
      tenantId: tenantSlug,
    });
  } catch (error) {
    console.error("[api/internal/sse-token] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get token" },
      { status: 500 }
    );
  }
}
