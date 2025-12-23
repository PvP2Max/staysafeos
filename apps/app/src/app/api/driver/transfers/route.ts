import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const api = await createApiClient();
    const transfers = await api.getMyTransfers();
    return NextResponse.json(transfers);
  } catch (error) {
    console.error("[api/driver/transfers] GET Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get transfers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const api = await createApiClient();
    const body = await request.json();
    const result = await api.requestTransfer(body.toMembershipId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/driver/transfers] POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to request transfer" },
      { status: 500 }
    );
  }
}
