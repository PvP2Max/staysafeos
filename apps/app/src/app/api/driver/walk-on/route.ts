import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const api = await createApiClient();
    const body = await request.json();
    const result = await api.createWalkOn(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/driver/walk-on] POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create walk-on ride" },
      { status: 500 }
    );
  }
}
