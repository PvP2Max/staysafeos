import { signIn } from "@logto/next/server-actions";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getLogtoConfig } from "@/lib/logto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ssoMode = searchParams.get("sso");

  // If this is an auto-SSO attempt, set a cookie to track it
  if (ssoMode === "auto") {
    const cookieStore = await cookies();
    cookieStore.set("staysafeos_sso_attempt", "auto", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60, // 1 minute - short lived
    });
  }

  try {
    const config = await getLogtoConfig();
    await signIn(config);
    // signIn will redirect, so this won't be reached
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("[api/auth/signin] Error:", error);
    return NextResponse.redirect(new URL("/?error=signin_failed", request.url));
  }
}
