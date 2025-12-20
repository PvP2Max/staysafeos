/**
 * API Client for Home Dashboard
 * Server-side client that uses Logto access tokens
 */

import { getLogtoContext } from "@logto/next/server-actions";
import { cookies } from "next/headers";
import { getLogtoConfig, getApiAccessToken } from "@/lib/logto";
import type { ApiError, Partner } from "./types";

const API_BASE_URL = process.env.API_URL || "https://api.staysafeos.com";

/**
 * Public API functions (no auth required)
 */
export async function fetchPartners(search?: string): Promise<Partner[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await fetch(`${API_BASE_URL}/v1/tenants${params}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch partners");
  }

  return response.json();
}

export async function checkSlugAvailability(slug: string): Promise<{ available: boolean; slug: string }> {
  const response = await fetch(`${API_BASE_URL}/v1/tenants/check-slug/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to check slug");
  }

  return response.json();
}

export class ApiClient {
  private accessToken?: string;
  private tenantId?: string;

  constructor(accessToken?: string, tenantId?: string) {
    this.accessToken = accessToken;
    this.tenantId = tenantId;
  }

  private async fetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only set Content-Type for requests with a body
    if (options.body) {
      (headers as Record<string, string>)["Content-Type"] = "application/json";
    }

    if (this.accessToken) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.accessToken}`;
    }

    if (this.tenantId) {
      (headers as Record<string, string>)["X-StaySafe-Tenant"] = this.tenantId;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        statusCode: response.status,
        message: response.statusText,
      }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text) as T;
  }

  // Account endpoints
  async getMe() {
    return this.fetch<{ id: string; email: string; name?: string }>("/v1/me");
  }

  async updateMe(data: { name?: string; phone?: string; avatarUrl?: string }) {
    return this.fetch("/v1/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Tenant endpoints
  async getTenant() {
    return this.fetch<{
      id: string;
      name: string;
      slug: string;
      domain?: string;
      logoUrl?: string;
      faviconUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      tertiaryColor?: string;
      features: Record<string, boolean>;
    }>("/v1/tenants/current");
  }

  async updateTenant(data: {
    name?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    tertiaryColor?: string;
  }) {
    return this.fetch("/v1/tenants/current", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async updateFeatures(features: Record<string, boolean>) {
    return this.fetch("/v1/tenants/current/features", {
      method: "PATCH",
      body: JSON.stringify({ features }),
    });
  }

  // Members endpoints
  async getMembers(params?: { role?: string; search?: string; take?: number; skip?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.set("role", params.role);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.take) searchParams.set("take", String(params.take));
    if (params?.skip) searchParams.set("skip", String(params.skip));

    const query = searchParams.toString();
    return this.fetch<{ data: Array<{
      id: string;
      accountId: string;
      role: string;
      active: boolean;
      account: { email: string; name?: string };
    }>; total: number }>(`/v1/tenants/current/members${query ? `?${query}` : ""}`);
  }

  async updateMemberRole(membershipId: string, role: string) {
    return this.fetch(`/v1/tenants/current/members/${membershipId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  }

  async removeMember(membershipId: string) {
    return this.fetch(`/v1/tenants/current/members/${membershipId}`, {
      method: "DELETE",
    });
  }

  // Pages endpoints
  async getPages() {
    return this.fetch<Array<{
      id: string;
      slug: string;
      title: string;
      published: boolean;
    }>>("/v1/pages");
  }

  async getPage(idOrSlug: string) {
    return this.fetch<{
      id: string;
      slug: string;
      title: string;
      blocks: unknown;
      published: boolean;
      editorType: "tiptap" | "grapesjs";
      htmlContent?: string;
      cssContent?: string;
      gjsComponents?: unknown;
      gjsStyles?: unknown;
      templateId?: string;
      isLandingPage: boolean;
    }>(`/v1/pages/${idOrSlug}`);
  }

  async createPage(data: {
    slug: string;
    title: string;
    blocks?: unknown;
    editorType?: "tiptap" | "grapesjs";
    htmlContent?: string;
    cssContent?: string;
    gjsComponents?: unknown;
    gjsStyles?: unknown;
    templateId?: string;
    isLandingPage?: boolean;
  }) {
    return this.fetch("/v1/pages", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePage(id: string, data: {
    title?: string;
    blocks?: unknown;
    published?: boolean;
    editorType?: "tiptap" | "grapesjs";
    htmlContent?: string;
    cssContent?: string;
    gjsComponents?: unknown;
    gjsStyles?: unknown;
  }) {
    return this.fetch(`/v1/pages/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deletePage(id: string) {
    return this.fetch(`/v1/pages/${id}`, {
      method: "DELETE",
    });
  }

  // Analytics endpoints
  async getAnalyticsSummary() {
    return this.fetch<{
      totalRides: number;
      activeRides: number;
      completedRides: number;
      cancelledRides: number;
      totalDrivers: number;
      onlineDrivers: number;
      totalVolunteers: number;
      totalVans: number;
      availableVans: number;
      avgWaitTime?: number;
      avgRating?: number;
    }>("/v1/analytics/summary");
  }

  async getRidesByDay(days?: number) {
    const params = days ? `?days=${days}` : "";
    return this.fetch<Array<{
      date: string;
      count: number;
      completed: number;
      cancelled: number;
    }>>(`/v1/analytics/rides/by-day${params}`);
  }

  // Vans endpoints
  async getVans() {
    return this.fetch<Array<{
      id: string;
      name: string;
      capacity: number;
      licensePlate?: string;
      status: string;
    }>>("/v1/vans");
  }

  async createVan(data: { name: string; capacity?: number; licensePlate?: string }) {
    return this.fetch("/v1/vans", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateVan(id: string, data: { name?: string; capacity?: number; licensePlate?: string; status?: string }) {
    return this.fetch(`/v1/vans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteVan(id: string) {
    return this.fetch(`/v1/vans/${id}`, {
      method: "DELETE",
    });
  }

  // Tenant creation
  async createTenant(data: { name: string; slug: string }) {
    return this.fetch<{
      id: string;
      name: string;
      slug: string;
    }>("/v1/tenants", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Get user's organizations
  async getMyOrganizations() {
    return this.fetch<{
      account: { id: string; email: string };
      membership?: { id: string; role: string; tenantId: string };
      ownedTenants: Array<{ id: string; slug: string; name: string; subscriptionTier: string }>;
    }>("/v1/me");
  }

  // Organization settings endpoints
  async getOrgSettings(orgId: string) {
    return this.fetch<{
      organizationId: string;
      organizationName: string;
      rankRequired: boolean;
      orgRequired: boolean;
      homeRequired: boolean;
    }>(`/v1/organizations/${orgId}/settings`);
  }

  async updateOrgSettings(orgId: string, settings: {
    rankRequired?: boolean;
    orgRequired?: boolean;
    homeRequired?: boolean;
  }) {
    return this.fetch<{ success: boolean }>(`/v1/organizations/${orgId}/settings`, {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
  }

  // Domains endpoints
  async getDomains() {
    return this.fetch<Array<{
      id: string;
      domain: string;
      isPrimary: boolean;
      verifiedAt: string | null;
      sslProvisioned: boolean;
      createdAt: string;
      dnsRecords: Array<{
        type: string;
        name: string;
        value: string;
        status: "pending" | "verified" | "error";
      }>;
    }>>("/v1/domains");
  }

  async addDomain(data: { domain: string; isPrimary?: boolean }) {
    return this.fetch<{
      id: string;
      domain: string;
      isPrimary: boolean;
      verifiedAt: string | null;
      sslProvisioned: boolean;
      createdAt: string;
      dnsRecords: Array<{
        type: string;
        name: string;
        value: string;
        status: "pending" | "verified" | "error";
      }>;
    }>("/v1/domains", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getDomain(id: string) {
    return this.fetch<{
      id: string;
      domain: string;
      isPrimary: boolean;
      verifiedAt: string | null;
      sslProvisioned: boolean;
      dnsRecords: Array<{
        type: string;
        name: string;
        value: string;
        status: "pending" | "verified" | "error";
      }>;
    }>(`/v1/domains/${id}`);
  }

  async verifyDomain(id: string) {
    return this.fetch<{
      id: string;
      domain: string;
      isPrimary: boolean;
      verifiedAt: string | null;
      sslProvisioned: boolean;
      createdAt: string;
      dnsRecords: Array<{
        type: string;
        name: string;
        value: string;
        status: "pending" | "verified" | "error";
      }>;
    }>(`/v1/domains/${id}/verify`, {
      method: "POST",
    });
  }

  async setPrimaryDomain(id: string) {
    return this.fetch(`/v1/domains/${id}/primary`, {
      method: "POST",
    });
  }

  async deleteDomain(id: string) {
    return this.fetch(`/v1/domains/${id}`, {
      method: "DELETE",
    });
  }
}

/**
 * Create an authenticated API client from the current Logto session
 */
export async function createApiClient(): Promise<ApiClient> {
  const config = getLogtoConfig();
  const { isAuthenticated } = await getLogtoContext(config);

  if (!isAuthenticated) {
    throw new Error("Not authenticated");
  }

  // Get API resource access token (not identity token)
  const accessToken = await getApiAccessToken();
  if (!accessToken) {
    throw new Error("Could not get API access token");
  }

  // Check for selected org in cookie first
  const cookieStore = await cookies();
  const selectedOrgId = cookieStore.get("staysafeos_current_org")?.value;

  let tenantId: string | undefined = selectedOrgId;

  // If no cookie, fall back to fetching user's default org
  if (!tenantId) {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });
      if (response.ok) {
        const me = await response.json();
        // Use the first owned tenant's ID, or fall back to membership's tenant
        const ownedTenants = me.ownedTenants as Array<{ id: string }> | undefined;
        const membership = me.membership as { tenantId: string } | undefined;
        tenantId = ownedTenants?.[0]?.id || membership?.tenantId;
      }
    } catch {
      // If we can't fetch, proceed without tenant context
    }
  }

  return new ApiClient(accessToken, tenantId);
}
