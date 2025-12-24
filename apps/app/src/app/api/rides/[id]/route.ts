import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const api = await createApiClient();
    const ride = await api.getRide(id);
    return NextResponse.json(ride);
  } catch (error) {
    console.error("[api/rides/[id]] GET Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch ride" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const api = await createApiClient();
    const ride = await api.updateRide(id, body);
    return NextResponse.json(ride);
  } catch (error) {
    console.error("[api/rides/[id]] PATCH Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update ride" },
      { status: 500 }
    );
  }
}
