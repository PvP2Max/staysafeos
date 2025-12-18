import { signIn } from "@logto/next/server-actions";
import { getLogtoConfig } from "@/lib/logto";

// Force runtime evaluation - env vars not available at build time on Render
export const dynamic = "force-dynamic";

export async function GET() {
  // Create fresh config at request time
  const config = getLogtoConfig();

  // Debug: log to verify env vars are loaded
  console.log("[signin] LOGTO_ENDPOINT:", process.env.LOGTO_ENDPOINT ? "set" : "NOT SET");
  console.log("[signin] Config endpoint:", config.endpoint);

  // Trigger Logto sign-in flow
  await signIn(config);
}
