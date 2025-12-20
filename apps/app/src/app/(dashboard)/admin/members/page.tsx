"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Avatar,
  AvatarFallback,
  Skeleton,
} from "@staysafeos/ui";
import { Users, Search, Trash2, UserCog } from "lucide-react";
import { ROLE_HIERARCHY, type Role } from "@/lib/roles";

interface Member {
  id: string;
  accountId: string;
  role: string;
  active: boolean;
  account?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-500/10 text-red-500 border-red-500/20",
  EXECUTIVE: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  DISPATCHER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  TC: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  DRIVER: "bg-green-500/10 text-green-500 border-green-500/20",
  SAFETY: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  RIDER: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/members");
      if (!response.ok) throw new Error("Failed to fetch members");
      const data = await response.json();
      setMembers(data.data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
      setMessage({ type: "error", text: "Failed to load members" });
    } finally {
      setLoading(false);
    }
  };

  const updateRole = (memberId: string, newRole: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/members/${memberId}/role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });

        if (!response.ok) throw new Error("Failed to update role");

        setMembers(members.map((m) =>
          m.id === memberId ? { ...m, role: newRole } : m
        ));
        setMessage({ type: "success", text: "Role updated successfully" });
      } catch {
        setMessage({ type: "error", text: "Failed to update role" });
      }
    });
  };

  const removeMember = (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/members/${memberId}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to remove member");

        setMembers(members.filter((m) => m.id !== memberId));
        setMessage({ type: "success", text: "Member removed successfully" });
      } catch {
        setMessage({ type: "error", text: "Failed to remove member" });
      }
    });
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      !search ||
      member.account?.email.toLowerCase().includes(search.toLowerCase()) ||
      member.account?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      member.account?.lastName?.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "all" || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getMemberName = (member: Member) => {
    if (member.account?.firstName && member.account?.lastName) {
      return `${member.account.firstName} ${member.account.lastName}`;
    }
    return member.account?.email.split("@")[0] || "Unknown";
  };

  const getMemberInitials = (member: Member) => {
    if (member.account?.firstName && member.account?.lastName) {
      return `${member.account.firstName[0]}${member.account.lastName[0]}`;
    }
    return member.account?.email[0]?.toUpperCase() || "?";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Members
        </h1>
        <p className="text-muted-foreground">
          Manage organization members and their roles.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-500/10 text-green-600"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <CardTitle>Organization Members</CardTitle>
              <CardDescription>
                {members.length} member{members.length !== 1 ? "s" : ""} total
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  className="pl-9 w-[200px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ROLE_HIERARCHY.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                  <Skeleton className="h-8 w-[100px]" />
                </div>
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No members found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getMemberInitials(member)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{getMemberName(member)}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.account?.email}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={ROLE_COLORS[member.role] || ""}
                  >
                    {member.role}
                  </Badge>
                  <div className="flex gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(value) => updateRole(member.id, value)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-[130px]">
                        <UserCog className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_HIERARCHY.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeMember(member.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
