import { signIn, getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@staysafeos/ui";
import { logtoConfig } from "@/lib/logto";
import Link from "next/link";
import { CreateOrganizationForm } from "./create-organization-form";
import { createApiClient } from "@/lib/api/client";

export const metadata = {
  title: "Create Organization | StaySafeOS",
  description: "Create your organization on StaySafeOS",
};

export default async function SignupPage() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  // Step 1: Sign in if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link href="/" className="text-2xl font-bold text-primary mb-2 inline-block">
              StaySafeOS
            </Link>
            <CardTitle>Create Your Organization</CardTitle>
            <CardDescription>
              First, sign in or create an account to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              action={async () => {
                "use server";
                // Sign in and return to signup page
                await signIn(logtoConfig, `${process.env.NEXT_PUBLIC_BASE_URL}/signup`);
              }}
            >
              <Button type="submit" className="w-full" size="lg">
                Continue with Logto
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Already have an organization?{" "}
              <Link href="/login" className="text-primary underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Check if user already owns an organization
  let existingOrg = null;
  try {
    const api = await createApiClient();
    const me = await api.getMyOrganizations();
    if (me.ownedTenants && me.ownedTenants.length > 0) {
      existingOrg = me.ownedTenants[0];
    }
  } catch {
    // User might not have an account yet - that's fine
  }

  // If they already have an org, offer to go to dashboard
  if (existingOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link href="/" className="text-2xl font-bold text-primary mb-2 inline-block">
              StaySafeOS
            </Link>
            <CardTitle>You Already Have an Organization</CardTitle>
            <CardDescription>
              You&apos;re the owner of <strong>{existingOrg.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard" className="block">
              <Button className="w-full" size="lg">
                Go to Dashboard
              </Button>
            </Link>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Want to create another organization?
            </p>
            <CreateOrganizationForm userEmail={claims?.email as string} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Show organization creation form
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="text-2xl font-bold text-primary mb-2 inline-block">
            StaySafeOS
          </Link>
          <CardTitle>Create Your Organization</CardTitle>
          <CardDescription>
            Set up your organization to start using StaySafeOS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrganizationForm userEmail={claims?.email as string} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Looking for an existing organization?{" "}
            <Link href="/partners" className="text-primary underline">
              Find yours
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
