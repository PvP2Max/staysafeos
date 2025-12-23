import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transferId: string }> }
) {
  try {
    const { transferId } = await params;
    const api = await createApiClient();
    const result = await api.acceptTransfer(transferId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/driver/transfers/[id]/accept] POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to accept transfer" },
      { status: 500 }
    );
  }
}
