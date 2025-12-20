import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export async function POST(request: NextRequest) {
  try {
    const api = await createApiClient();
    const body = await request.json();
    const shift = await api.createShift(body);
    return NextResponse.json(shift);
  } catch (error) {
    console.error("[api/shifts] POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create shift" },
      { status: 500 }
    );
  }
}
