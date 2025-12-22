import { signOut } from "@logto/next/server-actions";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getLogtoConfig } from "@/lib/logto";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  // Get the external host for redirects (Render uses internal ports like 10000)
  const headersList = await headers();
  const host = headersList.get("host") || "app.staysafeos.com";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

  try {
    const config = await getLogtoConfig();

    await signOut(config, baseUrl);
    // signOut will redirect, so this won't be reached
    return NextResponse.redirect(new URL("/", baseUrl));
  } catch (error) {
    console.error("[api/auth/signout] Error:", error);
    // Redirect to current domain's root on error
    return NextResponse.redirect(new URL("/", baseUrl));
  }
}
