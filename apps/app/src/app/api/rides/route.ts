import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const api = await createApiClient();

    const ride = await api.createRide({
      riderName: body.riderName,
      riderPhone: body.riderPhone,
      passengerCount: body.passengerCount || 1,
      pickupAddress: body.pickupAddress,
      dropoffAddress: body.dropoffAddress,
      notes: body.notes,
    });

    return NextResponse.json(ride);
  } catch (error) {
    console.error("[api/rides] Error creating ride:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create ride" },
      { status: 500 }
    );
  }
}
