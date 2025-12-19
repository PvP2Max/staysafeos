import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DomainManager } from "./domain-manager";
import { getPlanLimits } from "@/lib/stripe";
import { Card, CardContent, Button } from "@staysafeos/ui";
import Link from "next/link";

export const metadata = {
  title: "Custom Domains | StaySafeOS",
  description: "Manage your custom domains",
};

async function fetchDomains() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const cookie = headersList.get("cookie") || "";

  try {
    const response = await fetch(`${protocol}://${host}/api/domains`, {
      headers: { cookie },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  } catch {
    return [];
  }
}

async function fetchOrganizationTier(): Promise<{
  hasCustomDomainAccess: boolean;
  tier: string;
}> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const cookie = headersList.get("cookie") || "";

  try {
    const response = await fetch(`${protocol}://${host}/api/me`, {
      headers: { cookie },
      cache: "no-store",
    });

    if (!response.ok) {
      return { hasCustomDomainAccess: false, tier: "free" };
    }

    const me = await response.json();
    const tier = me.ownedTenants?.[0]?.subscriptionTier || "free";
    const limits = getPlanLimits(tier);

    return {
      hasCustomDomainAccess: limits.features.includes("custom_domain"),
      tier,
    };
  } catch {
    return { hasCustomDomainAccess: false, tier: "free" };
  }
}

export default async function DomainsPage() {
  const [domains, tierInfo] = await Promise.all([
    fetchDomains(),
    fetchOrganizationTier(),
  ]);

  // If user doesn't have access, show upgrade prompt
  if (!tierInfo.hasCustomDomainAccess) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Custom Domains</h1>
          <p className="text-muted-foreground mt-1">
            Connect your own domain to your StaySafeOS site
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-2">
                Upgrade to Pro for Custom Domains
              </h2>
              <p className="text-muted-foreground mb-6">
                Custom domains allow you to use your own URL (like
                rides.yourschool.edu) instead of the default StaySafeOS
                subdomain.
              </p>
              <Link href="/dashboard/billing">
                <Button size="lg">View Plans</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Custom Domains</h1>
        <p className="text-muted-foreground mt-1">
          Connect your own domain to your StaySafeOS site
        </p>
      </div>

      <DomainManager
        domains={domains}
        canAddDomains={tierInfo.hasCustomDomainAccess}
      />
    </div>
  );
}
