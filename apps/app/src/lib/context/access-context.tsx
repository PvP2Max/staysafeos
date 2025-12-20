"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AccessContext as AccessContextType } from "@/lib/roles";

const AccessContext = createContext<AccessContextType | null>(null);

interface AccessProviderProps {
  children: ReactNode;
  role: string | null;
  onShiftRoles: string[];
}

export function AccessProvider({ children, role, onShiftRoles }: AccessProviderProps) {
  return (
    <AccessContext.Provider value={{ role, onShiftRoles }}>
      {children}
    </AccessContext.Provider>
  );
}

export function useAccess(): AccessContextType {
  const context = useContext(AccessContext);
  if (!context) {
    return { role: null, onShiftRoles: [] };
  }
  return context;
}

/**
 * Hook to check if user can access a specific page
 */
export function useCanAccess(path: string): boolean {
  const { role, onShiftRoles } = useAccess();

  // Import here to avoid circular dependencies
  const { canAccessPage } = require("@/lib/roles");
  return canAccessPage(path, { role, onShiftRoles });
}

/**
 * Hook to check if user is on shift for a specific role
 */
export function useIsOnShift(shiftRole?: string): boolean {
  const { onShiftRoles } = useAccess();

  if (!shiftRole) {
    return onShiftRoles.length > 0;
  }
  return onShiftRoles.includes(shiftRole);
}
