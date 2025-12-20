"use client";

import Link from "next/link";
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
import { Avatar, AvatarFallback, Badge, Button, Separator } from "@staysafeos/ui";
import { LogOut, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { getNavItems, isNavItemActive, type NavSection } from "./nav-config";

interface AppSidebarProps {
  user: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  role: string | null;
  onShiftRoles: string[];
  onSignOut: () => void;
}

export function AppSidebar({ user, role, onShiftRoles, onSignOut }: AppSidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed, isMobile, setIsOpen } = useSidebar();

  const navSections = getNavItems(role, onShiftRoles);

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email.split("@")[0];

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.email[0].toUpperCase();

  const handleNavClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 overflow-hidden"
          onClick={handleNavClick}
        >
          <Shield className="h-6 w-6 shrink-0 text-primary" />
          {(!isCollapsed || isMobile) && (
            <span className="text-lg font-bold whitespace-nowrap">StaySafeOS</span>
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
        <Separator className="mb-4" />
        <div className={`flex items-center gap-3 ${isCollapsed && !isMobile ? "justify-center" : ""}`}>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          {(!isCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              {role && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {role}
                </Badge>
              )}
            </div>
          )}
        </div>
        {(!isCollapsed || isMobile) && (
          <form action={onSignOut} className="mt-3">
            <Button variant="ghost" size="sm" className="w-full justify-start" type="submit">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </form>
        )}
        {isCollapsed && !isMobile && (
          <form action={onSignOut} className="mt-3 flex justify-center">
            <Button variant="ghost" size="icon" className="h-9 w-9" type="submit">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
