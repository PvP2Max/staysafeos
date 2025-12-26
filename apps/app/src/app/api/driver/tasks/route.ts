import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const api = await createApiClient();
    const tasks = await api.getMyTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[api/driver/tasks] GET Error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
