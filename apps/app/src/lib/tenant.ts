import { headers } from "next/headers";

const API_URL = process.env.API_URL || "https://api.staysafeos.com";

/**
 * Lookup a custom domain to get its organization slug
 */
async function lookupCustomDomain(domain: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/v1/domains/lookup/${encodeURIComponent(domain)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.found && data.organizationSlug) {
      console.log(`[tenant] Custom domain "${domain}" resolved to org: ${data.organizationSlug}`);
      return data.organizationSlug;
    }
    return null;
  } catch (error) {
    console.error(`[tenant] Custom domain lookup failed for "${domain}":`, error);
    return null;
  }
}

/**
 * Get tenant ID from the current request context.
 * Checks X-StaySafe-Tenant header first, then custom domains, then parses subdomain from Host.
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

  // Check if this is a custom domain
  // Skip localhost and standard domains
  if (!hostWithoutPort.includes("localhost") &&
      !hostWithoutPort.endsWith(".staysafeos.com") &&
      hostWithoutPort !== "staysafeos.com") {
    console.log(`[tenant] Checking custom domain: ${hostWithoutPort}`);
    const orgSlug = await lookupCustomDomain(hostWithoutPort);
    if (orgSlug) {
      return orgSlug;
    }
  }

  console.log(`[tenant] Could not resolve tenant from host: ${host}`);
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
