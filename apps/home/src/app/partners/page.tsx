import { fetchPartners } from "@/lib/api/client";
import { PartnersSearch } from "./partners-search";

export const metadata = {
  title: "Partners | StaySafeOS",
  description: "Find your organization on StaySafeOS",
};

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const partners = await fetchPartners(params.search);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="/" className="text-xl font-bold text-primary">
            StaySafeOS
          </a>
          <nav className="flex items-center gap-4">
            <a href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign In
            </a>
            <a
              href="/signup"
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
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Find Your Organization</h1>
            <p className="text-lg text-muted-foreground">
              Search for your organization to sign in and access your dashboard
            </p>
          </div>

          <PartnersSearch initialSearch={params.search} />

          {/* Partners Grid */}
          <div className="mt-8">
            {partners.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No organizations found</p>
                <p className="text-sm mt-2">
                  {params.search
                    ? "Try a different search term"
                    : "Be the first to create an organization!"}
                </p>
                <a
                  href="/signup"
                  className="inline-block mt-4 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Create Organization
                </a>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {partners.map((partner) => (
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
            )}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center border-t pt-8">
            <h2 className="text-xl font-semibold mb-2">
              Don&apos;t see your organization?
            </h2>
            <p className="text-muted-foreground mb-4">
              Create a new organization to get started with StaySafeOS
            </p>
            <a
              href="/signup"
              className="inline-block rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Organization
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
