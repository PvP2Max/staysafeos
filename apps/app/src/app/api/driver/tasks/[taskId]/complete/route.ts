import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const api = await createApiClient();
    const result = await api.completeTask(taskId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/driver/tasks/[taskId]/complete] POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to complete task" },
      { status: 500 }
    );
  }
}
