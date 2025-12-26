import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const api = await createApiClient();
    const status = await api.getMyStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("[api/driver/status] GET Error:", error);
    return NextResponse.json({ online: false, van: null, role: "DRIVER" }, { status: 200 });
  }
}
