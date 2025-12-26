import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const api = await createApiClient();
    const vans = await api.getVans();
    return NextResponse.json(vans);
  } catch (error) {
    console.error("[api/driver/vans] GET Error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
