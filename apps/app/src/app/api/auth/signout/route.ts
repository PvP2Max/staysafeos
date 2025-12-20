import { signOut } from "@logto/next/server-actions";
import { NextRequest, NextResponse } from "next/server";
import { getLogtoConfig } from "@/lib/logto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const config = await getLogtoConfig();
    await signOut(config);
    // signOut will redirect, so this won't be reached
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("[api/auth/signout] Error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
