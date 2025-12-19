import { createApiClient } from "@/lib/api/client";
import { BrandingForm } from "./branding-form";
import { headers } from "next/headers";
import { getPlanLimits } from "@/lib/stripe";
import { Card, CardContent, Button } from "@staysafeos/ui";
import Link from "next/link";

async function fetchOrganizationTier(): Promise<{
  hasBrandingAccess: boolean;
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
      return { hasBrandingAccess: false, tier: "free" };
    }

    const me = await response.json();
    const tier = me.ownedTenants?.[0]?.subscriptionTier || "free";
    const limits = getPlanLimits(tier);

    return {
      hasBrandingAccess: limits.features.includes("custom_branding"),
      tier,
    };
  } catch {
    return { hasBrandingAccess: false, tier: "free" };
  }
}

export default async function BrandingPage() {
  const tierInfo = await fetchOrganizationTier();

  // If user doesn't have branding access, show upgrade prompt
  if (!tierInfo.hasBrandingAccess) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Branding</h1>
          <p className="text-muted-foreground mt-1">
            Customize how your organization appears to riders and volunteers
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-2">
                Upgrade to Growth for Custom Branding
              </h2>
              <p className="text-muted-foreground mb-6">
                Custom branding lets you personalize your organization with your
                own logo, favicon, and colors. Make your StaySafeOS site truly yours.
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

  let tenant = {
    name: "",
    logoUrl: "",
    faviconUrl: "",
    primaryColor: "#2563eb",
    secondaryColor: "#64748b",
    tertiaryColor: "#f1f5f9",
  };

  try {
    const api = await createApiClient();
    const data = await api.getTenant();
    tenant = {
      name: data.name || "",
      logoUrl: data.logoUrl || "",
      faviconUrl: data.faviconUrl || "",
      primaryColor: data.primaryColor || "#2563eb",
      secondaryColor: data.secondaryColor || "#64748b",
      tertiaryColor: data.tertiaryColor || "#f1f5f9",
    };
  } catch {
    // Use defaults if API fails
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Branding</h1>
        <p className="text-muted-foreground mt-1">
          Customize how your organization appears to riders and volunteers
        </p>
      </div>

      <BrandingForm initialData={tenant} />
    </div>
  );
}
