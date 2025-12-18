import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_URL || "https://api.staysafeos.com";

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
    const response = await fetch(
      `${API_BASE_URL}/v1/tenants/check-slug/${encodeURIComponent(slug)}`,
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
