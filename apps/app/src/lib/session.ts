import { headers } from "next/headers";

interface SessionData {
  authenticated: boolean;
  role: string | null;
  claims?: {
    email?: string;
    sub?: string;
  };
  profile?: {
    account?: {
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      rank?: string;
      unit?: string;
      homeAddress?: string;
      homeLat?: number;
      homeLng?: number;
    };
  };
  onShiftRoles: string[];
  theme?: {
    logoUrl?: string | null;
    faviconUrl?: string | null;
  } | null;
  status?: {
    hasAccount: boolean;
    hasMembership: boolean;
    role: string | null;
    tenantSlug: string | null;
  };
}

/**
 * Get session data from internal Route Handler.
 * Route Handlers work reliably with Logto session, Server Components don't.
 * Use this in Server Components to avoid race conditions.
 */
export async function getSessionData(): Promise<SessionData> {
  const headersList = await headers();
  const host = headersList.get("host") || "app.staysafeos.com";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const cookieHeader = headersList.get("cookie") || "";

  try {
    const response = await fetch(`${protocol}://${host}/api/internal/session-data`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (!response.ok) {
      return { authenticated: false, role: null, onShiftRoles: [] };
    }

    const data = await response.json();
    return {
      authenticated: data.authenticated || false,
      role: data.status?.role || null,
      claims: data.claims,
      profile: data.profile,
      onShiftRoles: data.onShiftRoles || [],
      theme: data.theme,
      status: data.status,
    };
  } catch {
    return { authenticated: false, role: null, onShiftRoles: [] };
  }
}

/**
 * Check if user has admin-level access (EXECUTIVE or ADMIN)
 */
export function isAdminRole(role: string | null): boolean {
  return role === "EXECUTIVE" || role === "ADMIN";
}

/**
 * Check if user can manage shifts/vans (DISPATCHER, EXECUTIVE, or ADMIN)
 */
export function canManageOperations(role: string | null): boolean {
  return ["EXECUTIVE", "ADMIN", "DISPATCHER"].includes(role || "");
}
