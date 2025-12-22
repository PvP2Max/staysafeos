import { NextResponse } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { getLogtoConfig, getApiAccessToken } from "@/lib/logto";
import { getTenantFromRequest } from "@/lib/tenant";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL || "https://api.staysafeos.com";

export async function GET() {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "unknown";

    const logtoConfig = await getLogtoConfig();
    const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated) {
      return NextResponse.json({
        error: "Not authenticated",
        host,
        logtoEndpoint: logtoConfig.endpoint,
      }, { status: 401 });
    }

    // Get the tenant slug from the request
    const tenantSlug = await getTenantFromRequest();

    const accessToken = await getApiAccessToken();
    if (!accessToken) {
      return NextResponse.json({
        error: "No access token",
        host,
        tenantSlug,
        claims: {
          sub: claims?.sub,
          email: claims?.email,
        },
      }, { status: 401 });
    }

    // Call the debug endpoint on the API
    const response = await fetch(`${API_URL}/v1/me/debug`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-StaySafe-Tenant": tenantSlug || "",
      },
    });

    const apiDebugData = await response.json();

    return NextResponse.json({
      appContext: {
        host,
        tenantSlug,
        logtoEndpoint: logtoConfig.endpoint,
        logtoAppId: logtoConfig.appId,
        apiUrl: API_URL,
        claims: {
          sub: claims?.sub,
          email: claims?.email,
        },
      },
      apiContext: apiDebugData,
      headers: {
        sentToApi: {
          "X-StaySafe-Tenant": tenantSlug || "(empty)",
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
