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

    // If vanId is null or empty, unassign the ride
    if (!body.vanId) {
      const ride = await api.unassignRide(id);
      return NextResponse.json(ride);
    }

    const ride = await api.assignRide(id, {
      vanId: body.vanId,
      driverId: body.driverId,
      tcId: body.tcId,
    });
    return NextResponse.json(ride);
  } catch (error) {
    console.error("[api/rides/[id]/assign] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to assign ride" },
      { status: 500 }
    );
  }
}
