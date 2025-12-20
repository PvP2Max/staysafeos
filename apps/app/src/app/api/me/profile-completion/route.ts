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

    const tenantId = await getTenantFromRequest();
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    if (tenantId) {
      headers["X-StaySafe-Tenant"] = tenantId;
    }

    const response = await fetch(`${API_BASE_URL}/v1/me/profile-completion`, {
      headers,
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to get profile completion" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/me/profile-completion] GET Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
