import { handleSignIn } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getLogtoConfig } from "@/lib/logto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const logtoConfig = await getLogtoConfig();

  // Check if this was an auto-SSO attempt
  const cookieStore = await cookies();
  const ssoAttempt = cookieStore.get("staysafeos_sso_attempt")?.value;

  try {
    await handleSignIn(logtoConfig, searchParams);
    // Clear SSO attempt cookie on success
    cookieStore.delete("staysafeos_sso_attempt");
  } catch (error) {
    console.error("[auth] Sign-in callback failed:", error);
    // If SSO failed, redirect with marker to prevent loops
    if (ssoAttempt === "auto") {
      cookieStore.delete("staysafeos_sso_attempt");
      redirect("/?sso=attempted");
    }
    redirect("/?error=callback_failed");
  }

  redirect("/dashboard");
}
