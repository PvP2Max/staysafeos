"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
} from "@staysafeos/ui";
import { LogOut, User, Key, ChevronUp } from "lucide-react";
import { EditProfileDialog } from "./edit-profile-dialog";

interface AccountMenuProps {
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
  isCollapsed: boolean;
  onSignOut: () => void;
  logtoEndpoint?: string;
}

export function AccountMenu({
  user,
  role,
  isCollapsed,
  onSignOut,
  logtoEndpoint,
}: AccountMenuProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email.split("@")[0];

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.email[0].toUpperCase();

  const handlePasswordReset = () => {
    // Redirect to Logto for password reset
    const endpoint = logtoEndpoint || "https://auth.staysafeos.com";
    window.open(`${endpoint}/account-settings`, "_blank");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 h-auto py-2 ${isCollapsed ? "justify-center px-2" : "px-3"}`}
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={isCollapsed ? "center" : "start"}
          side="top"
          className="w-56"
          sideOffset={8}
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              {role && (
                <Badge variant="outline" className="w-fit mt-1 text-xs">
                  {role}
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <User className="h-4 w-4 mr-2" />
            Edit Profile
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handlePasswordReset}>
            <Key className="h-4 w-4 mr-2" />
            Change Password
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={onSignOut}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        initialData={{
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          rank: user.rank,
          unit: user.unit,
          homeAddress: user.homeAddress,
          homeLat: user.homeLat,
          homeLng: user.homeLng,
        }}
      />
    </>
  );
}
