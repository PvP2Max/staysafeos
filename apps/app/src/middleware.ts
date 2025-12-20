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
    const response = await fetch(`${API_BASE_URL}/v1/tenants/${slug}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  } catch {
    // If API is down, allow through (fail open)
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
