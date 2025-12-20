import { NextResponse } from "next/server";
import { getLogtoContext } from "@logto/next/server-actions";
import { getLogtoConfig, getApiAccessToken } from "@/lib/logto";
import { uploadImage, validateImageFile, type ImageType } from "@/lib/r2/client";

// Force runtime evaluation
export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL || "https://api.staysafeos.com";

async function getOrganizationId(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/v1/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    // Get the organization ID from the user's owned tenants or memberships
    const orgId = data.ownedTenants?.[0]?.id || data.memberships?.[0]?.tenantId;
    return orgId || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const { isAuthenticated } = await getLogtoContext(getLogtoConfig());

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get access token
    const accessToken = await getApiAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Could not get API access token" },
        { status: 503 }
      );
    }

    // Get organization ID
    const organizationId = await getOrganizationId(accessToken);
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const validTypes: ImageType[] = ["logo", "favicon"];
    if (!type || !validTypes.includes(type as ImageType)) {
      return NextResponse.json(
        { error: "Invalid image type. Must be 'logo' or 'favicon'" },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Upload to Cloudflare Images
    const url = await uploadImage(
      file,
      organizationId,
      type as ImageType
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[upload] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
