import { getLogtoContext, signOut } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { getLogtoConfig } from "@/lib/logto";
import { createApiClient } from "@/lib/api/client";
import { DashboardShell } from "@/components/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logtoConfig = await getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated) {
    redirect("/");
  }

  // Fetch user data and membership status
  let role: string | null = null;
  let onShiftRoles: string[] = [];
  let user = {
    email: claims?.email as string || "",
    firstName: undefined as string | undefined,
    lastName: undefined as string | undefined,
  };

  try {
    const api = await createApiClient();

    // Check membership status
    const status = await api.getMembershipStatus();
    if (status.hasAccount && !status.hasMembership) {
      redirect("/no-membership");
    }
    role = status.role;

    // Get user profile
    try {
      const profile = await api.getMe();
      if (profile.account) {
        user = {
          email: profile.account.email,
          firstName: profile.account.firstName,
          lastName: profile.account.lastName,
        };
      }
    } catch {
      // Profile fetch failed, use claims data
    }

    // Get on-shift status
    try {
      const shiftStatus = await api.getOnShiftStatus();
      onShiftRoles = Object.keys(shiftStatus.roles).filter(
        (r) => shiftStatus.roles[r]
      );
    } catch {
      // On-shift check failed, continue without shift data
    }
  } catch {
    // If API calls fail, continue with defaults
  }

  async function handleSignOut() {
    "use server";
    const config = await getLogtoConfig();
    await signOut(config);
  }

  return (
    <DashboardShell
      user={user}
      role={role}
      onShiftRoles={onShiftRoles}
      signOutAction={handleSignOut}
    >
      {children}
    </DashboardShell>
  );
}
