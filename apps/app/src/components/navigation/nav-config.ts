/**
 * Navigation configuration with role-based visibility
 */

import {
  LayoutDashboard,
  Car,
  Radio,
  Truck,
  Users,
  GraduationCap,
  Calendar,
  BarChart3,
  Settings,
  UserCircle,
  Send,
  type LucideIcon,
} from "lucide-react";
import { type Role, isAdminLevel, isStaff, hasAnyRole } from "@/lib/roles";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  children?: NavItem[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/**
 * Get navigation items based on user role and on-shift status
 */
export function getNavItems(role: string | null, onShiftRoles: string[] = []): NavSection[] {
  const sections: NavSection[] = [];

  // Fallback when role is unknown - show basic navigation
  if (!role) {
    sections.push({
      title: "Navigation",
      items: [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ],
    });
    return sections;
  }

  // Rider section - only for riders
  if (role === "RIDER") {
    sections.push({
      items: [
        { title: "Request Ride", href: "/request", icon: Send },
      ],
    });
    return sections;
  }

  // Main navigation for staff
  const mainItems: NavItem[] = [];

  // Dashboard & Analytics - Admin only
  if (isAdminLevel(role)) {
    mainItems.push({ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard });
    mainItems.push({ title: "Analytics", href: "/analytics", icon: BarChart3 });
  }

  // Rides - All staff
  if (isStaff(role)) {
    mainItems.push({ title: "Rides", href: "/rides", icon: Car });
  }

  // Dispatch - Dispatcher or Admin (no shift requirement)
  if (isAdminLevel(role) || role === "DISPATCHER") {
    mainItems.push({ title: "Dispatch", href: "/dispatch", icon: Radio });
  }

  // Request Console - TC (always), Driver on-shift, or Admin
  const isDriver = role === "DRIVER";
  const isTc = role === "TC";
  const isOnDriverShift = onShiftRoles.includes("DRIVER");
  if (isAdminLevel(role) || isTc || (isDriver && isOnDriverShift)) {
    mainItems.push({ title: "Request Console", href: "/driver", icon: UserCircle });
  }

  // Vans - All staff
  if (isStaff(role)) {
    mainItems.push({ title: "Vans", href: "/vans", icon: Truck });
  }

  if (mainItems.length > 0) {
    sections.push({ title: "Operations", items: mainItems });
  }

  // Schedule section - All staff
  if (isStaff(role)) {
    sections.push({
      title: "Schedule",
      items: [
        { title: "Shifts", href: "/shifts", icon: Calendar },
        { title: "Training", href: "/training", icon: GraduationCap },
      ],
    });
  }

  // Admin section - Admin only
  if (isAdminLevel(role)) {
    sections.push({
      title: "Admin",
      items: [
        { title: "Members", href: "/admin/members", icon: Users },
        { title: "Settings", href: "/admin/settings", icon: Settings },
      ],
    });
  }

  return sections;
}

/**
 * Check if a nav item should be highlighted as active
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/dashboard" && pathname === "/dashboard") {
    return true;
  }
  // For other paths, check if pathname starts with href
  // But be careful with "/" matching everything
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}
