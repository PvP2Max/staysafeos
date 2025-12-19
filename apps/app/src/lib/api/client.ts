/**
 * API Client for Operations Dashboard
 */

import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import type { Ride, Van, AnalyticsSummary, TrainingModule, TrainingProgress, Shift, VanTransfer, VanTask, Membership } from "./types";

const API_BASE_URL = process.env.API_URL || "https://api.staysafeos.com";

export class ApiClient {
  private accessToken?: string;
  private tenantId?: string;

  constructor(accessToken?: string, tenantId?: string) {
    this.accessToken = accessToken;
    this.tenantId = tenantId;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
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
      const error = await response.json().catch(() => ({
        statusCode: response.status,
        message: response.statusText,
      }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }

  // Analytics
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    return this.fetch("/v1/analytics/summary");
  }

  // Rides
  async getRides(params?: { status?: string; search?: string; take?: number; skip?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.take) searchParams.set("take", String(params.take));
    if (params?.skip) searchParams.set("skip", String(params.skip));
    const query = searchParams.toString();
    return this.fetch<{ data: Ride[]; total: number }>(`/v1/rides${query ? `?${query}` : ""}`);
  }

  async getActiveRides(): Promise<Ride[]> {
    return this.fetch("/v1/rides/active");
  }

  async getRide(id: string): Promise<Ride> {
    return this.fetch(`/v1/rides/${id}`);
  }

  async createRide(data: {
    riderName: string;
    riderPhone: string;
    passengerCount?: number;
    pickupAddress: string;
    pickupLat?: number;
    pickupLng?: number;
    dropoffAddress: string;
    dropoffLat?: number;
    dropoffLng?: number;
    notes?: string;
    priority?: number;
  }) {
    return this.fetch<Ride>("/v1/rides", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createManualRide(data: {
    riderName: string;
    riderPhone: string;
    pickupAddress: string;
    dropoffAddress: string;
    vanId?: string;
    driverId?: string;
    tcId?: string;
  }) {
    return this.fetch<Ride>("/v1/rides/manual", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async assignRide(rideId: string, data: { vanId?: string; driverId?: string; tcId?: string }) {
    return this.fetch<Ride>(`/v1/rides/${rideId}/assign`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateRideStatus(rideId: string, status: string, cancelReason?: string) {
    return this.fetch<Ride>(`/v1/rides/${rideId}/status`, {
      method: "POST",
      body: JSON.stringify({ status, cancelReason }),
    });
  }

  async cancelRide(rideId: string, reason?: string) {
    return this.fetch(`/v1/rides/${rideId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // Vans
  async getVans(): Promise<Van[]> {
    return this.fetch("/v1/vans");
  }

  async getVan(id: string): Promise<Van> {
    return this.fetch(`/v1/vans/${id}`);
  }

  async getVanTasks(vanId: string): Promise<VanTask[]> {
    return this.fetch(`/v1/vans/${vanId}/tasks`);
  }

  async suggestVan(rideId: string): Promise<Van[]> {
    return this.fetch(`/v1/vans/suggest?rideId=${rideId}`);
  }

  // Driver endpoints
  async goOnline(vanId: string) {
    return this.fetch("/v1/driver/go-online", {
      method: "POST",
      body: JSON.stringify({ vanId }),
    });
  }

  async goOffline() {
    return this.fetch("/v1/driver/go-offline", {
      method: "POST",
    });
  }

  async getMyStatus() {
    return this.fetch<{ online: boolean; van?: Van; role: string }>("/v1/driver/status");
  }

  async sendLocationPing(lat: number, lng: number, heading?: number, speed?: number, passengerCount?: number) {
    return this.fetch("/v1/driver/ping", {
      method: "POST",
      body: JSON.stringify({ lat, lng, heading, speed, passengerCount }),
    });
  }

  async getMyTasks(): Promise<VanTask[]> {
    return this.fetch("/v1/driver/tasks");
  }

  async completeTask(taskId: string) {
    return this.fetch(`/v1/driver/tasks/${taskId}/complete`, {
      method: "POST",
    });
  }

  async createWalkOn(data: {
    riderName: string;
    riderPhone: string;
    passengerCount?: number;
    pickupAddress: string;
    dropoffAddress: string;
    notes?: string;
  }) {
    return this.fetch<Ride>("/v1/driver/walk-on", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Transfers
  async requestTransfer(toMembershipId: string) {
    return this.fetch<VanTransfer>("/v1/driver/transfers", {
      method: "POST",
      body: JSON.stringify({ toMembershipId }),
    });
  }

  async getMyTransfers(): Promise<VanTransfer[]> {
    return this.fetch("/v1/driver/transfers");
  }

  async acceptTransfer(transferId: string) {
    return this.fetch(`/v1/driver/transfers/${transferId}/accept`, {
      method: "POST",
    });
  }

  async declineTransfer(transferId: string) {
    return this.fetch(`/v1/driver/transfers/${transferId}/decline`, {
      method: "POST",
    });
  }

  // Training
  async getTrainingModules(category?: string): Promise<TrainingModule[]> {
    const params = category ? `?category=${category}` : "";
    return this.fetch(`/v1/training/modules${params}`);
  }

  async getTrainingModule(id: string): Promise<TrainingModule> {
    return this.fetch(`/v1/training/modules/${id}`);
  }

  async getMyProgress(): Promise<TrainingProgress[]> {
    return this.fetch("/v1/training/progress");
  }

  async markVideoComplete(moduleId: string) {
    return this.fetch(`/v1/training/modules/${moduleId}/complete`, {
      method: "POST",
    });
  }

  async submitQuiz(moduleId: string, answers: number[]) {
    return this.fetch<{ passed: boolean; score: number }>(`/v1/training/modules/${moduleId}/quiz`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  }

  // Shifts
  async getShifts(params?: { role?: string; from?: string; to?: string }): Promise<Shift[]> {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.set("role", params.role);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    const query = searchParams.toString();
    return this.fetch(`/v1/shifts${query ? `?${query}` : ""}`);
  }

  async signUpForShift(shiftId: string) {
    return this.fetch(`/v1/shifts/${shiftId}/signup`, {
      method: "POST",
    });
  }

  async cancelShiftSignup(shiftId: string) {
    return this.fetch(`/v1/shifts/${shiftId}/signup`, {
      method: "DELETE",
    });
  }

  async checkIn(shiftId: string) {
    return this.fetch(`/v1/shifts/${shiftId}/check-in`, {
      method: "POST",
    });
  }

  async checkOut(shiftId: string) {
    return this.fetch(`/v1/shifts/${shiftId}/check-out`, {
      method: "POST",
    });
  }

  // Members (for dispatcher views)
  async getOnlineDrivers(): Promise<Membership[]> {
    return this.fetch("/v1/driver/online");
  }

  async getAvailableVolunteers(): Promise<Membership[]> {
    return this.fetch("/v1/driver/available");
  }

  // Membership status check
  async getMembershipStatus() {
    return this.fetch<{
      hasAccount: boolean;
      hasMembership: boolean;
      tenantSlug: string | null;
      role: string | null;
    }>("/v1/me/membership-status");
  }
}

/**
 * Create authenticated API client from Logto session
 */
export async function createApiClient(): Promise<ApiClient> {
  const { isAuthenticated, accessToken, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated || !accessToken) {
    throw new Error("Not authenticated");
  }

  const organizations = claims?.organizations as string[] | undefined;
  const tenantId = organizations?.[0];

  return new ApiClient(accessToken, tenantId);
}

/**
 * Create API client with explicit token (for client components)
 */
export function createClientApiClient(accessToken: string, tenantId?: string): ApiClient {
  return new ApiClient(accessToken, tenantId);
}

/**
 * Public page data structure
 */
export interface PublicPage {
  id: string;
  slug: string;
  title: string;
  content: TiptapDoc;
  published: boolean;
}

export interface TiptapDoc {
  type: "doc";
  content: TiptapNode[];
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

/**
 * Fetch a public page without authentication
 * This is used for rendering tenant pages on subdomains
 */
export async function getPublicPage(tenantSlug: string, pageSlug: string): Promise<PublicPage | null> {
  const API_BASE_URL = process.env.API_URL || "https://api.staysafeos.com";

  try {
    const response = await fetch(`${API_BASE_URL}/v1/pages/public/${tenantSlug}/${pageSlug}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const data = await response.json();
    return data as PublicPage;
  } catch (error) {
    console.error("Error fetching public page:", error);
    return null;
  }
}
