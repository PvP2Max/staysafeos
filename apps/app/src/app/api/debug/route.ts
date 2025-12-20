import { getLogtoContext } from "@logto/next/server-actions";
import { NextResponse } from "next/server";
import { getLogtoConfig, getApiAccessToken } from "@/lib/logto";
import { getTenantFromRequest } from "@/lib/tenant";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.API_URL || "https://api.staysafeos.com";

export async function GET() {
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const tenantSlug = await getTenantFromRequest();

    const logtoConfig = await getLogtoConfig();
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

    // Try to get access token for API resource
    let accessToken: string | undefined;
    let tokenError: string | undefined;
    try {
      accessToken = await getApiAccessToken();
      if (!accessToken) {
        tokenError = "getApiAccessToken returned undefined (likely LOGTO_API_RESOURCE not set or token fetch failed)";
      }
    } catch (err) {
      tokenError = `Token fetch error: ${String(err)}`;
    }

    // Always return debug info, even if not authenticated
    const debugInfo: Record<string, unknown> = {
      appContext: {
        host,
        tenantSlugFromSubdomain: tenantSlug,
        apiUrl: API_BASE_URL,
        isAuthenticated,
        hasAccessToken: !!accessToken,
        logtoEndpoint: process.env.LOGTO_ENDPOINT,
        logtoApiResource: process.env.LOGTO_API_RESOURCE || "(not set)",
        userEmail: claims?.email || null,
        userId: claims?.sub || null,
      },
    };

    if (!isAuthenticated) {
      return NextResponse.json({
        ...debugInfo,
        error: "Not authenticated on this subdomain",
        hint: "You need to log in on this subdomain. Try visiting the home page first.",
      });
    }

    if (!accessToken) {
      return NextResponse.json({
        ...debugInfo,
        error: "Authenticated but no API access token",
        tokenError,
        hint: "Check that LOGTO_API_RESOURCE is configured and that the user's session has permission for it.",
      });
    }

    // If authenticated, call the API debug endpoint
    const apiHeaders: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    if (tenantSlug) {
      apiHeaders["X-StaySafe-Tenant"] = tenantSlug;
    }

    const response = await fetch(`${API_BASE_URL}/v1/me/debug`, {
      headers: apiHeaders,
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json({
        ...debugInfo,
        apiError: data.message || "Failed to get debug info from API",
        apiStatus: response.status,
      });
    }

    return NextResponse.json({
      ...debugInfo,
      ...data,
    });
  } catch (error) {
    console.error("[api/debug] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
