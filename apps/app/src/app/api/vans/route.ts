import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const api = await createApiClient();
    const vans = await api.getVans();
    return NextResponse.json(vans);
  } catch (error) {
    console.error("[api/vans] GET Error:", error);
    return NextResponse.json([], { status: 200 }); // Return empty array on error
  }
}

export async function POST(request: NextRequest) {
  try {
    const api = await createApiClient();
    const body = await request.json();
    const van = await api.createVan(body);
    return NextResponse.json(van);
  } catch (error) {
    console.error("[api/vans] POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create van" },
      { status: 500 }
    );
  }
}
