import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/api/client";

export async function GET() {
  try {
    const api = await createApiClient();
    // Get the user's org info to get the org ID
    const me = await api.getMe();
    const orgId = me.ownedTenants?.[0]?.id || me.membership?.tenantId;

    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const settings = await api.getOrgSettings(orgId);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[api/settings] GET Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const api = await createApiClient();
    const body = await request.json();

    // Get the user's org info to get the org ID
    const me = await api.getMe();
    const orgId = me.ownedTenants?.[0]?.id || me.membership?.tenantId;

    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const result = await api.updateOrgSettings(orgId, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/settings] PATCH Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 500 }
    );
  }
}
