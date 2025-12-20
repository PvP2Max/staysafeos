import { signOut } from "@logto/next/server-actions";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getLogtoConfig } from "@/lib/logto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const config = await getLogtoConfig();

    // Get the current host to redirect back to after signout
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3001";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const postLogoutRedirectUri = `${protocol}://${host}`;

    await signOut(config, postLogoutRedirectUri);
    // signOut will redirect, so this won't be reached
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("[api/auth/signout] Error:", error);
    // Redirect to current domain's root on error
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3001";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    return NextResponse.redirect(new URL(`${protocol}://${host}/`));
  }
}
