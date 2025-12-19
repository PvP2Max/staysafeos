"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@staysafeos/ui";

interface Organization {
  id: string;
  name: string;
  slug: string;
  role?: string;
}

interface OrgSwitcherProps {
  className?: string;
}

export function OrgSwitcher({ className }: OrgSwitcherProps) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const response = await fetch("/api/organizations");
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data.organizations);
          setCurrentOrgId(data.currentOrganizationId);
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrgs();
  }, []);

  const currentOrg = organizations.find((org) => org.id === currentOrgId);

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === currentOrgId || switching) return;

    setSwitching(true);
    try {
      const response = await fetch("/api/organizations/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      });

      if (response.ok) {
        setCurrentOrgId(orgId);
        // Reload to refresh all data with new org context
        router.refresh();
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to switch organization:", error);
    } finally {
      setSwitching(false);
    }
  };

  // Don't show if only one or no orgs
  if (loading || organizations.length <= 1) {
    if (loading) {
      return (
        <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className || ""}`}>
          <BuildingIcon className="h-4 w-4" />
          <span>Loading...</span>
        </div>
      );
    }
    // Show current org name without dropdown if only one org
    if (organizations.length === 1) {
      return (
        <div className={`flex items-center gap-2 text-sm ${className || ""}`}>
          <BuildingIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{organizations[0].name}</span>
        </div>
      );
    }
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${className || ""}`}
          disabled={switching}
        >
          <BuildingIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium max-w-[150px] truncate">
            {switching ? "Switching..." : currentOrg?.name || "Select Organization"}
          </span>
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start" forceMount>
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitchOrg(org.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{org.name}</span>
              <span className="text-xs text-muted-foreground">{org.role || "member"}</span>
            </div>
            {org.id === currentOrgId && (
              <CheckIcon className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Icons
function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
