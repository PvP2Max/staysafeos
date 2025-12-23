import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NOMINATIM_BASE_URL = process.env.NOMINATIM_URL || "https://nominatim.pvp2max.com";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length < 3) {
      return NextResponse.json([]);
    }

    const params = new URLSearchParams({
      format: "json",
      q: query,
      countrycodes: "us",
      limit: "5",
      addressdetails: "1",
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers: {
        "User-Agent": "StaySafeOS/1.0 (https://staysafeos.com)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("[api/geocode/search] Nominatim error:", response.status, response.statusText);
      return NextResponse.json([]);
    }

    const results = await response.json();
    return NextResponse.json(results);
  } catch (error) {
    console.error("[api/geocode/search] Error:", error);
    return NextResponse.json([]);
  }
}
