"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge, Button, Separator } from "@staysafeos/ui";
import { ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { getNavItems, isNavItemActive, type NavSection } from "./nav-config";
import { AccountMenu } from "./account-menu";

interface AppSidebarProps {
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
  onSignOut: () => void;
  theme?: {
    logoUrl?: string | null;
    faviconUrl?: string | null;
  };
  logtoEndpoint?: string;
}

export function AppSidebar({ user, role, onShiftRoles, onSignOut, theme, logtoEndpoint }: AppSidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed, isMobile, setIsOpen } = useSidebar();

  const navSections = getNavItems(role, onShiftRoles);

  const handleNavClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Determine which logo to show based on collapse state
  const showCustomLogo = theme?.logoUrl && (!isCollapsed || isMobile);
  const showCustomFavicon = theme?.faviconUrl && isCollapsed && !isMobile;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 overflow-hidden"
          onClick={handleNavClick}
        >
          {showCustomLogo ? (
            <Image
              src={theme.logoUrl!}
              alt="Organization logo"
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
            />
          ) : showCustomFavicon ? (
            <Image
              src={theme.faviconUrl!}
              alt="Organization icon"
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 object-contain"
            />
          ) : (
            <>
              <Shield className="h-6 w-6 shrink-0 text-primary" />
              {(!isCollapsed || isMobile) && (
                <span className="text-lg font-bold whitespace-nowrap">StaySafeOS</span>
              )}
            </>
          )}
        </Link>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </SidebarHeader>

      <SidebarContent>
        {navSections.map((section, sectionIdx) => (
          <SidebarGroup key={sectionIdx}>
            {section.title && (
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            )}
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive = isNavItemActive(item.href, pathname);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href} onClick={handleNavClick}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        {(!isCollapsed || isMobile) && (
                          <span className="truncate">{item.title}</span>
                        )}
                        {item.badge && (!isCollapsed || isMobile) && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <Separator className="mb-2" />
        <AccountMenu
          user={user}
          role={role}
          isCollapsed={isCollapsed && !isMobile}
          onSignOut={onSignOut}
          logtoEndpoint={logtoEndpoint}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
