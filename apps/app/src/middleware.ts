import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL = process.env.API_URL || "https://api.staysafeos.com";

// Paths that should not trigger tenant validation
const PUBLIC_PATHS = [
  "/partner-not-found",
  "/api",
  "/_next",
  "/favicon.ico",
];

function getTenantFromHost(host: string): string | null {
  const hostWithoutPort = host.split(":")[0];

  // Check for staysafeos.com domain
  if (hostWithoutPort.endsWith(".staysafeos.com")) {
    const subdomain = hostWithoutPort.replace(".staysafeos.com", "");
    // Ignore www and empty subdomain
    if (subdomain && subdomain !== "www" && subdomain !== "app") {
      return subdomain;
    }
  }

  // For localhost development with format: tenantslug.localhost
  if (hostWithoutPort.endsWith(".localhost")) {
    const subdomain = hostWithoutPort.replace(".localhost", "");
    if (subdomain) {
      return subdomain;
    }
  }

  return null;
}

async function tenantExists(slug: string): Promise<boolean> {
  try {
    // Use the list endpoint with search parameter - more reliable than single-tenant lookup
    // This is the same endpoint that /partners uses, which we know works
    const searchUrl = `${API_BASE_URL}/v1/tenants?search=${encodeURIComponent(slug)}`;
    console.log(`[middleware] Checking tenant exists: ${slug} via ${searchUrl}`);

    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`[middleware] Tenant search for "${slug}": status=${response.status}, ok=${response.ok}`);

    if (!response.ok) {
      console.error(`[middleware] Tenant search failed with status ${response.status}`);
      return true; // Fail open if API returns error
    }

    const tenants = await response.json();
    console.log(`[middleware] Tenant search returned ${Array.isArray(tenants) ? tenants.length : 0} results`);

    // Check if any tenant in the list has a matching slug (case-insensitive)
    if (Array.isArray(tenants)) {
      const found = tenants.find(
        (t: { slug?: string }) => t.slug?.toLowerCase() === slug.toLowerCase()
      );
      console.log(`[middleware] Tenant "${slug}":`, found ? `found (id: ${found.id}, slug: ${found.slug})` : 'not found');
      return !!found;
    }

    return false;
  } catch (error) {
    // If API is down, allow through (fail open)
    console.error(`[middleware] Tenant check failed for "${slug}":`, error);
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip validation for public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get tenant from host
  const host = request.headers.get("host") || "";
  const tenant = getTenantFromHost(host);

  // If no tenant subdomain, allow through (will be handled by app)
  if (!tenant) {
    return NextResponse.next();
  }

  // Check if tenant exists
  const exists = await tenantExists(tenant);

  if (!exists) {
    // Redirect to partner-not-found page
    const url = request.nextUrl.clone();
    url.pathname = "/partner-not-found";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
