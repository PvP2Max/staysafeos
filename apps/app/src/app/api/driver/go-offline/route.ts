import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const api = await createApiClient();
    const result = await api.goOffline();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/driver/go-offline] POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to go offline" },
      { status: 500 }
    );
  }
}
