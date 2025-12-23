import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const api = await createApiClient();
    const body = await request.json();
    const result = await api.goOnline(body.vanId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/driver/go-online] POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to go online" },
      { status: 500 }
    );
  }
}
