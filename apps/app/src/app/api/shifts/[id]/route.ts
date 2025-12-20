import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const api = await createApiClient();
    const body = await request.json();
    const shift = await api.updateShift(id, body);
    return NextResponse.json(shift);
  } catch (error) {
    console.error("[api/shifts/[id]] PATCH Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update shift" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const api = await createApiClient();
    await api.deleteShift(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/shifts/[id]] DELETE Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete shift" },
      { status: 500 }
    );
  }
}
