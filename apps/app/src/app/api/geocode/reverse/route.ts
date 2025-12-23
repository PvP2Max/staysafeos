import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const NOMINATIM_BASE_URL = process.env.NOMINATIM_URL || "https://nominatim.pvp2max.com";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
    }

    const params = new URLSearchParams({
      format: "json",
      lat,
      lon: lng,
      addressdetails: "1",
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
      headers: {
        "User-Agent": "StaySafeOS/1.0 (https://staysafeos.com)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("[api/geocode/reverse] Nominatim error:", response.status, response.statusText);
      return NextResponse.json({ display_name: null });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/geocode/reverse] Error:", error);
    return NextResponse.json({ display_name: null });
  }
}
