"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@staysafeos/ui";
import { updateMemberRole, removeMember } from "@/lib/api/actions";

interface Member {
  id: string;
  accountId: string;
  role: string;
  active: boolean;
  account: { email: string; name?: string };
}

interface MembersTableProps {
  members: Member[];
}

const ROLES = [
  { value: "EXECUTIVE", label: "Executive" },
  { value: "ADMIN", label: "Admin" },
  { value: "DISPATCHER", label: "Dispatcher" },
  { value: "TC", label: "TC" },
  { value: "DRIVER", label: "Driver" },
  { value: "SAFETY", label: "Safety" },
  { value: "RIDER", label: "Rider" },
];

const ROLE_COLORS: Record<string, string> = {
  EXECUTIVE: "bg-purple-100 text-purple-800",
  ADMIN: "bg-red-100 text-red-800",
  DISPATCHER: "bg-blue-100 text-blue-800",
  TC: "bg-green-100 text-green-800",
  DRIVER: "bg-yellow-100 text-yellow-800",
  SAFETY: "bg-orange-100 text-orange-800",
  RIDER: "bg-gray-100 text-gray-800",
};

export function MembersTable({ members }: MembersTableProps) {
  const [isPending, startTransition] = useTransition();
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [removingMember, setRemovingMember] = useState<Member | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const handleRoleChange = () => {
    if (!editingMember || !selectedRole) return;

    startTransition(async () => {
      await updateMemberRole(editingMember.id, selectedRole);
      setEditingMember(null);
      setSelectedRole("");
    });
  };

  const handleRemove = () => {
    if (!removingMember) return;

    startTransition(async () => {
      await removeMember(removingMember.id);
      setRemovingMember(null);
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No members found
              </p>
            ) : (
              <div className="divide-y">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {(member.account.name || member.account.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.account.name || "No name"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.account.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={ROLE_COLORS[member.role] || "bg-gray-100"}>
                        {member.role}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingMember(member);
                            setSelectedRole(member.role);
                          }}
                        >
                          Change Role
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setRemovingMember(member)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Role Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for {editingMember?.account.name || editingMember?.account.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong>{removingMember?.account.name || removingMember?.account.email}</strong>{" "}
              from your organization? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovingMember(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isPending}>
              {isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
