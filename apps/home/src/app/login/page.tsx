import { signIn, getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { logtoConfig } from "@/lib/logto";

export default async function LoginPage() {
  // Check if already logged in
  const { isAuthenticated } = await getLogtoContext(logtoConfig);

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  // Directly trigger Logto sign-in
  await signIn(logtoConfig);
}
