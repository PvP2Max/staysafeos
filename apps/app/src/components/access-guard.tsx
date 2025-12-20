import { redirect } from "next/navigation";
import { canAccessPage, getAccessDeniedRedirect, type AccessContext } from "@/lib/roles";

interface AccessGuardProps {
  path: string;
  role: string | null;
  onShiftRoles: string[];
  children: React.ReactNode;
}

/**
 * Server component that checks page access and redirects if denied
 */
export function AccessGuard({ path, role, onShiftRoles, children }: AccessGuardProps) {
  const context: AccessContext = { role, onShiftRoles };

  if (!canAccessPage(path, context)) {
    const redirectTo = getAccessDeniedRedirect(role);
    redirect(redirectTo);
  }

  return <>{children}</>;
}

/**
 * Helper to create an access guard for a specific page
 */
export function createAccessGuard(path: string) {
  return function PageAccessGuard({
    role,
    onShiftRoles,
    children,
  }: Omit<AccessGuardProps, "path">) {
    return (
      <AccessGuard path={path} role={role} onShiftRoles={onShiftRoles}>
        {children}
      </AccessGuard>
    );
  };
}
