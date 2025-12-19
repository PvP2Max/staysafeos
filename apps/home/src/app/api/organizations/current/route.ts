import { getLogtoContext } from "@logto/next/server-actions";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getLogtoConfig } from "@/lib/logto";

export const dynamic = "force-dynamic";

/**
 * POST /api/organizations/current - Set the current organization
 */
export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated } = await getLogtoContext(getLogtoConfig());

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { organizationId } = body as { organizationId: string };

    if (!organizationId) {
      return NextResponse.json(
        { message: "organizationId is required" },
        { status: 400 }
      );
    }

    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set("staysafeos_current_org", organizationId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return NextResponse.json({ success: true, organizationId });
  } catch (error) {
    console.error("[api/organizations/current] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/organizations/current - Get the current organization ID
 */
export async function GET() {
  try {
    const { isAuthenticated } = await getLogtoContext(getLogtoConfig());

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const currentOrgId = cookieStore.get("staysafeos_current_org")?.value;

    return NextResponse.json({ organizationId: currentOrgId || null });
  } catch (error) {
    console.error("[api/organizations/current] Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
