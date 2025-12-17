/**
 * API Client for Home Dashboard
 * Server-side client that uses Logto access tokens
 */

import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import type { ApiError } from "./types";

const API_BASE_URL = process.env.API_URL || "https://api.staysafeos.com";

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
      "Content-Type": "application/json",
      ...options.headers,
    };

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
      content: unknown;
      published: boolean;
    }>(`/v1/pages/${idOrSlug}`);
  }

  async createPage(data: { slug: string; title: string; content?: unknown }) {
    return this.fetch("/v1/pages", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePage(id: string, data: { title?: string; content?: unknown; published?: boolean }) {
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
}

/**
 * Create an authenticated API client from the current Logto session
 */
export async function createApiClient(): Promise<ApiClient> {
  const { isAuthenticated, accessToken, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !accessToken) {
    throw new Error("Not authenticated");
  }

  // Get tenant ID from organization claims or context
  const organizations = claims?.organizations as string[] | undefined;
  const tenantId = organizations?.[0];

  return new ApiClient(accessToken, tenantId);
}
