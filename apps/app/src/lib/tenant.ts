import { headers } from "next/headers";

/**
 * Get tenant ID from the current request context.
 * Checks X-StaySafe-Tenant header first, then parses subdomain from Host.
 */
export async function getTenantFromRequest(): Promise<string | null> {
  const headersList = await headers();

  // Check for explicit tenant header first
  const tenantHeader = headersList.get("x-staysafe-tenant");
  if (tenantHeader) {
    return tenantHeader;
  }

  // Parse subdomain from Host header
  const host = headersList.get("host");
  if (!host) {
    return null;
  }

  // Extract subdomain from host
  // e.g., "wainwright.staysafeos.com" -> "wainwright"
  // Handle localhost for development
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

/**
 * Get tenant ID, throwing an error if not found
 */
export async function requireTenant(): Promise<string> {
  const tenant = await getTenantFromRequest();
  if (!tenant) {
    throw new Error("Tenant not found in request context");
  }
  return tenant;
}
