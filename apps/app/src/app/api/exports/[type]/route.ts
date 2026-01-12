import { NextRequest, NextResponse } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { getLogtoConfig, getApiAccessToken } from "@/lib/logto";
import { getTenantFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.API_URL || "https://api.staysafeos.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const logtoConfig = await getLogtoConfig();
    const { isAuthenticated } = await getLogtoContext(logtoConfig);

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await getApiAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: "No access token" }, { status: 401 });
    }

    const tenantSlug = await getTenantFromRequest();

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "csv";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build API URL
    let url = `${API_BASE_URL}/v1/exports/${type}?format=${format}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    // Forward request to API
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
    };
    if (tenantSlug) {
      headers["X-StaySafe-Tenant"] = tenantSlug;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || `API error: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the file content
    const blob = await response.blob();
    const contentType = response.headers.get("Content-Type") || "application/octet-stream";
    const contentDisposition = response.headers.get("Content-Disposition") || "";

    // Return the file
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (error) {
    console.error("[exports] Error:", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}
