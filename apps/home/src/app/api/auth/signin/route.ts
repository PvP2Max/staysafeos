import { signIn } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";

// Force runtime evaluation - env vars not available at build time on Render
export const dynamic = "force-dynamic";

export async function GET() {
  // Trigger Logto sign-in flow
  await signIn(logtoConfig);
}
