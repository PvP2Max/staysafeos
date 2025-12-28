import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("[api/shifts] GET: Creating API client...");
    const api = await createApiClient();
    console.log("[api/shifts] GET: API client created, fetching shifts...");
    const shifts = await api.getShifts();
    console.log("[api/shifts] GET: Fetched", shifts.length, "shifts");

    // Filter out shifts older than 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const filteredShifts = shifts.filter((shift: { startTime: string }) => {
      const shiftDate = new Date(shift.startTime);
      return shiftDate >= threeDaysAgo;
    });

    console.log("[api/shifts] GET: After filtering (3 days):", filteredShifts.length, "shifts");

    // Sort newest to oldest (by startTime)
    const sortedShifts = filteredShifts.sort((a: { startTime: string }, b: { startTime: string }) => {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

    return NextResponse.json(sortedShifts);
  } catch (error) {
    console.error("[api/shifts] GET Error:", error);
    // Return error message for debugging (will show in Render logs)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      shifts: []
    }, { status: 200 });
  }
}

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
