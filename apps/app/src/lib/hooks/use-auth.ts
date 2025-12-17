"use client";

import { createContext, useContext } from "react";
import type { MemberRole, Membership } from "@/lib/api/types";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  membership?: Membership;
  accessToken: string;
  tenantId?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  role: MemberRole | null;
  hasRole: (roles: MemberRole | MemberRole[]) => boolean;
  isDispatcher: boolean;
  isDriver: boolean;
  isTC: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRole: MemberRole | null, roles: MemberRole | MemberRole[]): boolean {
  if (!userRole) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(userRole);
}

/**
 * Role hierarchy for checking permissions
 */
const ROLE_HIERARCHY: Record<MemberRole, number> = {
  EXECUTIVE: 100,
  ADMIN: 90,
  DISPATCHER: 70,
  TC: 50,
  DRIVER: 40,
  SAFETY: 30,
  RIDER: 10,
};

/**
 * Check if user has at least the specified role level
 */
export function hasMinimumRole(userRole: MemberRole | null, minimumRole: MemberRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}
