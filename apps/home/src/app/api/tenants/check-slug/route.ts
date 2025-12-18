import { NextRequest, NextResponse } from "next/server";

// Force runtime evaluation - env vars not available at build time on Render
export const dynamic = "force-dynamic";

// Helper to get API URL at request time, not module load time
function getApiBaseUrl() {
  return process.env.API_URL || "https://api.staysafeos.com";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { message: "Slug parameter required" },
        { status: 400 }
      );
    }

    // Forward to API (public endpoint, no auth required)
    const apiUrl = getApiBaseUrl();
    const response = await fetch(
      `${apiUrl}/v1/tenants/check-slug/${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to check slug" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/tenants/check-slug] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
