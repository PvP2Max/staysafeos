import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const api = await createApiClient();
    const member = await api.updateMemberRole(id, role);

    return NextResponse.json(member);
  } catch (error) {
    console.error("[api/members/[id]/role] Error updating role:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update role" },
      { status: 500 }
    );
  }
}
