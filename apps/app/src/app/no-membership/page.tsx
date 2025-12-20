import { getLogtoContext, signOut } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { getLogtoConfig } from "@/lib/logto";
import { Button } from "@staysafeos/ui";

export const metadata = {
  title: "Access Denied | StaySafeOS",
  description: "You don't have access to this organization",
};

export default async function NoMembershipPage() {
  const logtoConfig = await getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  // If not authenticated, redirect to home
  if (!isAuthenticated) {
    redirect("/");
  }

  const userEmail = claims?.email as string | undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Not a Member</h1>
          <p className="text-muted-foreground">
            Your account{userEmail ? ` (${userEmail})` : ""} exists, but you&apos;re not a member of this organization.
          </p>
        </div>

        {/* Explanation */}
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p>
            This email may already be registered with another StaySafeOS partner organization.
            Check our partners page to find your organization.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <a
            href="https://staysafeos.com/partners"
            className="block w-full"
          >
            <Button className="w-full" size="lg">
              Find Your Organization
            </Button>
          </a>

          <form
            action={async () => {
              "use server";
              const config = await getLogtoConfig();
              await signOut(config);
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              Sign Out & Try Different Account
            </Button>
          </form>
        </div>

        {/* Contact */}
        <p className="text-sm text-muted-foreground">
          Need help?{" "}
          <a href="mailto:support@staysafeos.com" className="text-primary hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
