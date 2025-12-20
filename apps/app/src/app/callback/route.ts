import { handleSignIn } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { getLogtoConfig } from "@/lib/logto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const logtoConfig = await getLogtoConfig();

  try {
    await handleSignIn(logtoConfig, searchParams);
  } catch (error) {
    console.error("[auth] Sign-in callback failed:", error);
    redirect("/?error=callback_failed");
  }

  redirect("/dashboard");
}
