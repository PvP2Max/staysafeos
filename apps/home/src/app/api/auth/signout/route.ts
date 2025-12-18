import { signOut } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";

// Force runtime evaluation - env vars not available at build time on Render
export const dynamic = "force-dynamic";

export async function GET() {
  // signOut will redirect to Logto to end the session
  // Don't wrap in try/catch - let the redirect happen
  await signOut(logtoConfig);
}
