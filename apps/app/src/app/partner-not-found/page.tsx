import { getTenantFromRequest } from "@/lib/tenant";

const API_BASE_URL = process.env.API_URL || "https://api.staysafeos.com";

interface Partner {
  id: string;
  name: string;
  slug: string;
  theme?: {
    logoUrl?: string;
    primaryColor?: string;
  };
}

async function fetchPartners(): Promise<Partner[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/tenants`, {
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

export const metadata = {
  title: "Partner Not Found | StaySafeOS",
  description: "This organization doesn't exist on StaySafeOS",
};

export default async function PartnerNotFoundPage() {
  const attemptedSlug = await getTenantFromRequest();
  const partners = await fetchPartners();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="https://staysafeos.com" className="text-xl font-bold text-primary">
            StaySafeOS
          </a>
          <nav className="flex items-center gap-4">
            <a
              href="https://staysafeos.com/partners"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              All Partners
            </a>
            <a
              href="https://staysafeos.com/signup"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Error Message */}
          <div className="text-center mb-12">
            <div className="mx-auto w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-6">
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
            <h1 className="text-3xl font-bold mb-4">Partner Not Found</h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              {attemptedSlug ? (
                <>
                  The organization <span className="font-semibold">&quot;{attemptedSlug}&quot;</span> doesn&apos;t exist on StaySafeOS.
                </>
              ) : (
                "This organization doesn't exist on StaySafeOS."
              )}
            </p>
          </div>

          {/* Partners Grid */}
          {partners.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-center mb-6">
                Our Current Partners
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {partners.slice(0, 6).map((partner) => (
                  <a
                    key={partner.id}
                    href={`https://${partner.slug}.staysafeos.com`}
                    className="group block rounded-lg border bg-card p-6 hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {partner.theme?.logoUrl ? (
                        <img
                          src={partner.theme.logoUrl}
                          alt={partner.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                          {partner.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                          {partner.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {partner.slug}.staysafeos.com
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              {partners.length > 6 && (
                <div className="text-center mt-6">
                  <a
                    href="https://staysafeos.com/partners"
                    className="text-primary hover:underline font-medium"
                  >
                    View all {partners.length} partners
                  </a>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="text-center border-t pt-8">
            <h2 className="text-xl font-semibold mb-2">
              Looking for your organization?
            </h2>
            <p className="text-muted-foreground mb-4">
              Search our partners page to find your organization, or create a new one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://staysafeos.com/partners"
                className="inline-block rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Find Your Organization
              </a>
              <a
                href="https://staysafeos.com/signup"
                className="inline-block rounded-md border border-primary px-6 py-3 text-sm font-medium text-primary hover:bg-primary/10"
              >
                Create Organization
              </a>
            </div>
          </div>

          {/* Contact */}
          <p className="text-sm text-muted-foreground text-center mt-8">
            Need help?{" "}
            <a href="mailto:support@staysafeos.com" className="text-primary hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
