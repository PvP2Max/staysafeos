import { getLogtoContext, signIn } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { getLogtoConfig } from "@/lib/logto";
import { getTenantFromRequest } from "@/lib/tenant";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@staysafeos/ui";
import Link from "next/link";
import { headers } from "next/headers";

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: string;
  theme?: {
    logoUrl?: string | null;
    primaryColor?: string | null;
  } | null;
}

interface LandingPage {
  slug: string;
  title: string;
  published: boolean;
  editorType: string;
  htmlContent?: string | null;
  cssContent?: string | null;
}

async function getTenantInfo(slug: string): Promise<TenantInfo | null> {
  try {
    const response = await fetch(`${process.env.API_URL}/v1/tenants/${slug}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function getLandingPage(slug: string): Promise<LandingPage | null> {
  try {
    const response = await fetch(`${process.env.API_URL}/v1/pages/public/${slug}/home`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export default async function AppIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Get dynamic config based on current host
  const logtoConfig = await getLogtoConfig();

  // Check if logged in
  const { isAuthenticated } = await getLogtoContext(logtoConfig);

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  // Get tenant from subdomain or custom domain
  const tenantSlug = await getTenantFromRequest();

  if (!tenantSlug) {
    // No tenant context - show generic page
    return <SimpleSignInPage />;
  }

  // Fetch tenant info
  const tenant = await getTenantInfo(tenantSlug);

  if (!tenant) {
    redirect("/partner-not-found");
  }

  // Check if we should auto-redirect to Logto for SSO
  // Skip if user explicitly wants to see landing page (?landing=true)
  // or if auto-signin already attempted (?sso=attempted)
  const params = await searchParams;
  const showLanding = params.landing === "true";
  const ssoAttempted = params.sso === "attempted";

  // For custom domains or when coming from another StaySafeOS domain,
  // auto-redirect through Logto to establish session
  if (!showLanding && !ssoAttempted) {
    // Check if user might already be logged in elsewhere by redirecting through Logto
    // The ?sso=attempted prevents infinite loops
    const headersList = await headers();
    const referer = headersList.get("referer") || "";
    const isFromStaySafeOS = referer.includes("staysafeos.com");

    // Auto-SSO if coming from another StaySafeOS domain
    if (isFromStaySafeOS) {
      redirect("/api/auth/signin?sso=auto");
    }
  }

  // Check if tier supports custom pages
  const tierHasPages = ["growth", "pro", "enterprise"].includes(tenant.subscriptionTier);

  if (tierHasPages) {
    // Try to get custom landing page
    const page = await getLandingPage(tenantSlug);
    if (page?.published && page.htmlContent) {
      return <LandingPageRenderer page={page} tenant={tenant} />;
    }
  }

  // Free/Starter or no custom page: Show simple sign-in with org branding
  return <SimpleSignInPage tenant={tenant} />;
}

function SimpleSignInPage({ tenant }: { tenant?: TenantInfo }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {tenant?.theme?.logoUrl ? (
            <img
              src={tenant.theme.logoUrl}
              alt={tenant.name}
              className="h-12 mx-auto mb-4 object-contain"
            />
          ) : (
            <CardTitle className="text-2xl font-bold text-primary">
              {tenant?.name || "StaySafeOS Operations"}
            </CardTitle>
          )}
          <CardDescription>
            {tenant ? `Sign in to access ${tenant.name}` : "Sign in to access the dispatch dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={async () => {
              "use server";
              const config = await getLogtoConfig();
              await signIn(config);
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              Sign in
            </Button>
          </form>
          <div className="text-center text-xs text-muted-foreground space-x-2">
            <Link
              href="https://staysafeos.com/privacy"
              className="hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </Link>
            <span>|</span>
            <Link
              href="https://staysafeos.com/terms"
              className="hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LandingPageRenderer({ page, tenant }: { page: LandingPage; tenant: TenantInfo }) {
  return (
    <>
      {page.cssContent && (
        <style dangerouslySetInnerHTML={{ __html: page.cssContent }} />
      )}
      <div dangerouslySetInnerHTML={{ __html: page.htmlContent || "" }} />
      {/* Hidden sign-in form for landing pages */}
      <form
        id="staysafeos-signin"
        action={async () => {
          "use server";
          const config = await getLogtoConfig();
          await signIn(config);
        }}
        style={{ display: "none" }}
      >
        <button type="submit">Sign In</button>
      </form>
    </>
  );
}
