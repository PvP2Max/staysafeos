"use client";

import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Shield } from "lucide-react";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
      <SidebarTrigger />
      <Link href="/dashboard" className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold">StaySafeOS</span>
      </Link>
    </header>
  );
}
