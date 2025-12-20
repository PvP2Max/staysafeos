import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const role = searchParams.get("role") || undefined;

    const api = await createApiClient();
    const members = await api.getMembers({ search, role });

    return NextResponse.json(members);
  } catch (error) {
    console.error("[api/members] Error fetching members:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch members" },
      { status: 500 }
    );
  }
}
