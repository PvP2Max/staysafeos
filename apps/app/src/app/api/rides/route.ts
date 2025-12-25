import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const api = await createApiClient();
    const { searchParams } = new URL(request.url);

    const rides = await api.getRides({
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      take: searchParams.get("take") ? parseInt(searchParams.get("take")!) : undefined,
      skip: searchParams.get("skip") ? parseInt(searchParams.get("skip")!) : undefined,
    });

    return NextResponse.json(rides);
  } catch (error) {
    console.error("[api/rides] GET Error:", error);
    return NextResponse.json({ data: [], total: 0 }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
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
