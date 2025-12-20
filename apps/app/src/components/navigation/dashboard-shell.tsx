"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { MobileHeader } from "./mobile-header";

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
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
  role: string | null;
  onShiftRoles: string[];
  signOutAction: () => Promise<void>;
  theme?: {
    logoUrl?: string | null;
    faviconUrl?: string | null;
  };
  logtoEndpoint?: string;
}

export function DashboardShell({
  children,
  user,
  role,
  onShiftRoles,
  signOutAction,
  theme,
  logtoEndpoint,
}: DashboardShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        user={user}
        role={role}
        onShiftRoles={onShiftRoles}
        onSignOut={signOutAction}
        theme={theme}
        logtoEndpoint={logtoEndpoint}
      />
      <SidebarInset>
        <MobileHeader />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
