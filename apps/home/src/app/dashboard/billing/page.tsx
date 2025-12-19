import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from "@staysafeos/ui";
import { PricingTable } from "./pricing-table";
import { ManageSubscriptionButton } from "./manage-subscription-button";
import { headers } from "next/headers";

export const metadata = {
  title: "Billing | StaySafeOS",
  description: "Manage your subscription and billing",
};

const tierDetails: Record<string, { name: string; price: string; description: string }> = {
  free: { name: "Free Trial", price: "$0", description: "10 rides/month, perfect for testing" },
  starter: { name: "Starter", price: "$99/mo", description: "75 rides/month, 1 vehicle" },
  growth: { name: "Growth", price: "$199/mo", description: "200 rides/month, 2 vehicles, custom branding" },
  pro: { name: "Pro", price: "$299/mo", description: "400 rides/month, 3 vehicles, full features" },
  enterprise: { name: "Enterprise", price: "Custom", description: "Unlimited rides, custom vehicle limits, white-label" },
};

interface SubscriptionDetails {
  hasSubscription: boolean;
  tier: string;
  price?: {
    amount: number;
    currency: string;
    interval: string;
  };
  status?: string;
  cancelAtPeriodEnd?: boolean;
}

async function fetchSubscriptionDetails(organizationId: string): Promise<SubscriptionDetails | null> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const cookie = headersList.get("cookie") || "";

  try {
    const response = await fetch(
      `${protocol}://${host}/api/billing/subscription?organizationId=${organizationId}`,
      {
        headers: { cookie },
        cache: "no-store",
      }
    );

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function fetchMyOrganizations() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const cookie = headersList.get("cookie") || "";

  const response = await fetch(`${protocol}://${host}/api/me`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return response.json();
}

export default async function BillingPage() {
  let currentTier = "free";
  let organizationId: string | null = null;
  let organizationName: string | null = null;
  let subscriptionDetails: SubscriptionDetails | null = null;

  try {
    const me = await fetchMyOrganizations();
    if (me?.ownedTenants && me.ownedTenants.length > 0) {
      const org = me.ownedTenants[0];
      organizationId = org.id;
      organizationName = org.name;
      currentTier = org.subscriptionTier || "free";

      // Fetch actual subscription details from Stripe
      subscriptionDetails = await fetchSubscriptionDetails(org.id);
    }
  } catch {
    // User may not have API access yet
  }

  const tierInfo = tierDetails[currentTier] || tierDetails.free;

  // For enterprise with active subscription, show actual price from Stripe
  const displayPrice =
    currentTier === "enterprise" && subscriptionDetails?.price
      ? `$${subscriptionDetails.price.amount}/${subscriptionDetails.price.interval === "month" ? "mo" : subscriptionDetails.price.interval}`
      : tierInfo.price;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Plan
            <Badge variant={currentTier === "free" ? "secondary" : "default"}>
              {tierInfo.name}
            </Badge>
          </CardTitle>
          <CardDescription>
            {organizationName ? `Subscription for ${organizationName}` : "No organization selected"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">{displayPrice}</p>
              <p className="text-sm text-muted-foreground">{tierInfo.description}</p>
              {subscriptionDetails?.cancelAtPeriodEnd && (
                <p className="text-sm text-orange-500 mt-1">
                  Subscription will cancel at end of billing period
                </p>
              )}
            </div>
            {organizationId && currentTier !== "free" && (
              <ManageSubscriptionButton organizationId={organizationId} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {organizationId ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {currentTier === "free" ? "Choose a Plan" : "Change Plan"}
          </h2>
          <PricingTable currentTier={currentTier} organizationId={organizationId} organizationName={organizationName || undefined} />
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Create an organization first to manage billing.
            </p>
            <Button className="mt-4" asChild>
              <a href="/dashboard/organizations">Go to Organizations</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
