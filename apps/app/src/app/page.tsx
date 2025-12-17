import { getLogtoContext, signIn } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { logtoConfig } from "@/lib/logto";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@staysafeos/ui";

export default async function AppIndexPage() {
  // Check if logged in
  const { isAuthenticated } = await getLogtoContext(logtoConfig);

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">StaySafeOS Operations</CardTitle>
          <CardDescription>Sign in to access the dispatch dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signIn(logtoConfig);
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
