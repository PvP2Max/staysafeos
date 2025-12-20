import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const api = await createApiClient();
    await api.removeMember(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/members/[id]] Error removing member:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove member" },
      { status: 500 }
    );
  }
}
