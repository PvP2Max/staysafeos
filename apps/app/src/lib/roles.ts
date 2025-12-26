/**
 * Role-based access control utilities
 */

// Role hierarchy from lowest to highest privilege
export const ROLE_HIERARCHY = [
  "RIDER",
  "SAFETY",
  "DRIVER",
  "TC",
  "DISPATCHER",
  "EXECUTIVE",
  "ADMIN",
] as const;

export type Role = (typeof ROLE_HIERARCHY)[number];

/**
 * Get the numeric level of a role (higher = more privileges)
 */
export function getRoleLevel(role: string): number {
  const index = ROLE_HIERARCHY.indexOf(role as Role);
  return index === -1 ? 0 : index;
}

/**
 * Check if user has at least the minimum required role
 */
export function hasMinRole(userRole: string | null, minRole: Role): boolean {
  if (!userRole) return false;
  return getRoleLevel(userRole) >= getRoleLevel(minRole);
}

/**
 * Check if user has exactly a specific role
 */
export function hasRole(userRole: string | null, role: Role): boolean {
  return userRole === role;
}

/**
 * Check if user has one of the specified roles
 */
export function hasAnyRole(userRole: string | null, roles: Role[]): boolean {
  if (!userRole) return false;
  return roles.includes(userRole as Role);
}

/**
 * Check if user has admin-level access (EXECUTIVE or ADMIN)
 */
export function isAdminLevel(userRole: string | null): boolean {
  return hasAnyRole(userRole, ["EXECUTIVE", "ADMIN"]);
}

/**
 * Check if user is staff (everyone except RIDER)
 */
export function isStaff(userRole: string | null): boolean {
  return userRole !== null && userRole !== "RIDER";
}

/**
 * Roles that can access operational panels when on-shift
 */
export const SHIFT_ROLES = ["DRIVER", "TC", "DISPATCHER", "SAFETY"] as const;
export type ShiftRole = (typeof SHIFT_ROLES)[number];

/**
 * Check if a role is a shift-based role
 */
export function isShiftRole(role: string): role is ShiftRole {
  return SHIFT_ROLES.includes(role as ShiftRole);
}

/**
 * Page access rules
 * Returns true if user can access the page
 */
export interface AccessContext {
  role: string | null;
  onShiftRoles: string[];
}

type AccessCheck = (ctx: AccessContext) => boolean;

export const PAGE_ACCESS_RULES: Record<string, AccessCheck> = {
  // Rider-only page
  "/request": (ctx) => hasRole(ctx.role, "RIDER"),

  // Admin pages (EXECUTIVE, ADMIN only)
  "/dashboard": (ctx) => isAdminLevel(ctx.role),
  "/analytics": (ctx) => isAdminLevel(ctx.role),
  "/admin": (ctx) => isAdminLevel(ctx.role),
  "/admin/members": (ctx) => isAdminLevel(ctx.role),
  "/admin/settings": (ctx) => isAdminLevel(ctx.role),
  "/admin/domains": (ctx) => isAdminLevel(ctx.role),

  // Staff pages (everyone except RIDER)
  "/training": (ctx) => isStaff(ctx.role),
  "/shifts": (ctx) => isStaff(ctx.role),
  "/rides": (ctx) => isStaff(ctx.role),
  "/vans": (ctx) => isStaff(ctx.role),

  // Dispatcher panel: DISPATCHER, TC, or admin (no shift requirement)
  "/dispatch": (ctx) => {
    if (isAdminLevel(ctx.role)) return true;
    return hasAnyRole(ctx.role, ["DISPATCHER", "TC"]);
  },

  // Driver panel: DRIVER/TC + on-shift, OR admin
  "/driver": (ctx) => {
    if (isAdminLevel(ctx.role)) return true;
    const isDriverOrTc = hasAnyRole(ctx.role, ["DRIVER", "TC"]);
    const onShift = ctx.onShiftRoles.includes("DRIVER") || ctx.onShiftRoles.includes("TC");
    return isDriverOrTc && onShift;
  },
};

/**
 * Check if user can access a specific page
 */
export function canAccessPage(path: string, ctx: AccessContext): boolean {
  // Check for exact match first
  if (PAGE_ACCESS_RULES[path]) {
    return PAGE_ACCESS_RULES[path](ctx);
  }

  // Check for prefix matches (e.g., /admin/* matches /admin/members)
  for (const [rulePath, check] of Object.entries(PAGE_ACCESS_RULES)) {
    if (path.startsWith(rulePath + "/")) {
      return check(ctx);
    }
  }

  // Default: allow access (for pages without explicit rules)
  return true;
}

/**
 * Get the default redirect path based on role
 */
export function getDefaultRedirect(role: string | null): string {
  if (!role) return "/";

  if (role === "RIDER") return "/request";
  if (isAdminLevel(role)) return "/dashboard";

  // Staff members go to shifts
  return "/shifts";
}

/**
 * Get access denied redirect based on role
 */
export function getAccessDeniedRedirect(role: string | null): string {
  return getDefaultRedirect(role);
}
