import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const api = await createApiClient();
    await api.cancelRide(id, body.reason);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/rides/[id]/cancel] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel ride" },
      { status: 500 }
    );
  }
}
