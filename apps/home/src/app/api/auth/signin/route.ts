import { signIn } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";

export async function GET() {
  // Trigger Logto sign-in flow
  await signIn(logtoConfig);
}
