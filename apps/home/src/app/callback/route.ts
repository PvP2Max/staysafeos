import { handleSignIn } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { logtoConfig } from "@/lib/logto";

// Force runtime evaluation - env vars not available at build time on Render
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  try {
    await handleSignIn(logtoConfig, searchParams);
  } catch (error) {
    console.error("[auth] Sign-in callback failed:", error);
    // Redirect to login with error
    redirect("/login?error=callback_failed");
  }

  // Redirect to dashboard after successful sign-in
  redirect("/dashboard");
}
