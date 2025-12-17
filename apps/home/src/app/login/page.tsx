import { signIn, getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@staysafeos/ui";
import { logtoConfig } from "@/lib/logto";
import Link from "next/link";

export default async function LoginPage() {
  // Check if already logged in
  const { isAuthenticated } = await getLogtoContext(logtoConfig);

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="text-2xl font-bold text-primary mb-2 inline-block">
            StaySafeOS
          </Link>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signIn(logtoConfig);
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              Sign in with Logto
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
