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
    const van = await api.updateVan(id, body);
    return NextResponse.json(van);
  } catch (error) {
    console.error("[api/vans/[id]] PATCH Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update van" },
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
    await api.deleteVan(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/vans/[id]] DELETE Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete van" },
      { status: 500 }
    );
  }
}
