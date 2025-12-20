import { getLogtoContext } from "@logto/next/server-actions";
import { NextResponse } from "next/server";
import { getLogtoConfig } from "@/lib/logto";
import { getTenantFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.API_URL || "https://api.staysafeos.com";

export async function GET() {
  try {
    const logtoConfig = await getLogtoConfig();
    const { isAuthenticated, accessToken } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated || !accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const tenantSlug = await getTenantFromRequest();

    // Log what we're sending
    console.log("[debug] Calling API with tenant slug:", tenantSlug);

    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    if (tenantSlug) {
      headers["X-StaySafe-Tenant"] = tenantSlug;
    }

    const response = await fetch(`${API_BASE_URL}/v1/me/debug`, {
      headers,
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to get debug info", apiStatus: response.status },
        { status: response.status }
      );
    }

    // Add local context info
    return NextResponse.json({
      ...data,
      appContext: {
        tenantSlugFromSubdomain: tenantSlug,
        apiUrl: API_BASE_URL,
      },
    });
  } catch (error) {
    console.error("[api/debug] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
