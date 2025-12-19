import { NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export async function GET() {
  try {
    const api = await createApiClient();
    const domains = await api.getDomains();
    return NextResponse.json(domains);
  } catch (error) {
    console.error("Error fetching domains:", error);
    return NextResponse.json(
      { error: "Failed to fetch domains" },
      { status: 500 }
    );
  }
}
