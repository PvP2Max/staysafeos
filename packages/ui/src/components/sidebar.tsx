"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronLeft, ChevronRight, PanelLeft } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Sheet, SheetContent } from "./sheet";

// Constants
const SIDEBAR_WIDTH = "280px";
const SIDEBAR_WIDTH_COLLAPSED = "72px";
const SIDEBAR_WIDTH_MOBILE = "280px";

// Context
interface SidebarContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

// Provider
interface SidebarProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultCollapsed?: boolean;
  defaultOpen?: boolean;
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
  defaultOpen = false,
  className,
  ...props
}: SidebarProviderProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setIsOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        setIsOpen,
        isCollapsed,
        setIsCollapsed,
        isMobile,
        toggleSidebar,
      }}
    >
      <div
        className={cn("flex min-h-screen w-full", className)}
        style={{
          "--sidebar-width": SIDEBAR_WIDTH,
          "--sidebar-width-collapsed": SIDEBAR_WIDTH_COLLAPSED,
          "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
        } as React.CSSProperties}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

// Sidebar wrapper
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsible?: "none" | "icon" | "full";
}

export function Sidebar({
  children,
  className,
  collapsible = "icon",
  ...props
}: SidebarProps) {
  const { isOpen, setIsOpen, isCollapsed, isMobile } = useSidebar();

  // Mobile: render as Sheet
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-[var(--sidebar-width-mobile)] p-0" showClose={false}>
          <div className="flex h-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: render as fixed sidebar
  const width = collapsible !== "none" && isCollapsed
    ? "var(--sidebar-width-collapsed)"
    : "var(--sidebar-width)";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background transition-all duration-300 ease-out",
        className
      )}
      style={{ width }}
      {...props}
    >
      {children}
    </aside>
  );
}

// Sidebar header
export function SidebarHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex h-16 shrink-0 items-center border-b px-4", className)} {...props}>
      {children}
    </div>
  );
}

// Sidebar content
export function SidebarContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex-1 overflow-y-auto overflow-x-hidden py-2", className)} {...props}>
      {children}
    </div>
  );
}

// Sidebar footer
export function SidebarFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("shrink-0 border-t p-4", className)} {...props}>
      {children}
    </div>
  );
}

// Sidebar group
export function SidebarGroup({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-2 py-2", className)} {...props}>
      {children}
    </div>
  );
}

// Sidebar group label
export function SidebarGroupLabel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isCollapsed, isMobile } = useSidebar();

  if (isCollapsed && !isMobile) {
    return null;
  }

  return (
    <div
      className={cn(
        "px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Sidebar menu
export function SidebarMenu({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn("flex flex-col gap-1", className)} {...props}>
      {children}
    </ul>
  );
}

// Sidebar menu item
export function SidebarMenuItem({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li className={cn("relative", className)} {...props}>
      {children}
    </li>
  );
}

// Sidebar menu button
const sidebarMenuButtonVariants = cva(
  "group/menu-button flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        active:
          "bg-primary/10 text-primary hover:bg-primary/15",
      },
      size: {
        default: "h-10",
        sm: "h-9",
        lg: "h-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean;
  tooltip?: string;
  isActive?: boolean;
}

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, variant, size, asChild = false, tooltip, isActive, children, ...props }, ref) => {
    const { isCollapsed, isMobile } = useSidebar();
    const Comp = asChild ? Slot : "button";

    const actualVariant = isActive ? "active" : variant;

    const button = (
      <Comp
        ref={ref}
        className={cn(
          sidebarMenuButtonVariants({ variant: actualVariant, size }),
          isCollapsed && !isMobile && "justify-center px-2",
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );

    if (isCollapsed && !isMobile && tooltip) {
      return (
        <div className="group relative">
          {button}
          <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            {tooltip}
          </span>
        </div>
      );
    }

    return button;
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";

// Sidebar menu badge
export function SidebarMenuBadge({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  const { isCollapsed, isMobile } = useSidebar();

  if (isCollapsed && !isMobile) {
    return null;
  }

  return (
    <span
      className={cn(
        "ml-auto text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Sidebar menu sub
export function SidebarMenuSub({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  const { isCollapsed, isMobile } = useSidebar();

  if (isCollapsed && !isMobile) {
    return null;
  }

  return (
    <ul
      className={cn("ml-4 mt-1 flex flex-col gap-1 border-l pl-4", className)}
      {...props}
    >
      {children}
    </ul>
  );
}

// Sidebar menu sub button
export const SidebarMenuSubButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; isActive?: boolean }
>(({ className, asChild = false, isActive, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        isActive
          ? "text-primary font-medium"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

// Sidebar collapse trigger
export function SidebarTrigger({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { isCollapsed, toggleSidebar, isMobile } = useSidebar();

  if (isMobile) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9", className)}
        onClick={toggleSidebar}
        {...props}
      >
        <PanelLeft className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8", className)}
      onClick={toggleSidebar}
      {...props}
    >
      {isCollapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}

// Sidebar inset (main content area)
export function SidebarInset({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isCollapsed, isMobile } = useSidebar();

  return (
    <div
      className={cn(
        "flex flex-1 flex-col transition-all duration-300 ease-out",
        !isMobile && "ml-[var(--sidebar-width)]",
        !isMobile && isCollapsed && "ml-[var(--sidebar-width-collapsed)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
