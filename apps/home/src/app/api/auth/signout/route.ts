import { signOut } from "@logto/next/server-actions";
import { getLogtoConfig } from "@/lib/logto";

// Force runtime evaluation - env vars not available at build time on Render
export const dynamic = "force-dynamic";

export async function GET() {
  // Create fresh config at request time
  const config = getLogtoConfig();

  // Debug: log to verify env vars are loaded
  console.log("[signout] LOGTO_ENDPOINT:", process.env.LOGTO_ENDPOINT ? "set" : "NOT SET");
  console.log("[signout] Config endpoint:", config.endpoint);

  // signOut will redirect to Logto to end the session
  // Don't wrap in try/catch - let the redirect happen
  await signOut(config);
}
