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
  Label,
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

interface SupportCode {
  id: string;
  code: string;
  type: string;
  grantedRole?: string;
  expiresAt: string;
  maxUses?: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
}

export default function SupportCodesPage() {
  const [isPending, startTransition] = useTransition();
  const [codes, setCodes] = useState<SupportCode[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [newCode, setNewCode] = useState({
    type: "ROLE_ELEVATION",
    grantedRole: "DRIVER",
    expiresIn: "7", // days
    maxUses: "10",
  });

  useEffect(() => {
    fetch("/api/support-codes")
      .then((res) => res.json())
      .then((data) => setCodes(data))
      .catch(() => {});
  }, []);

  const handleCreate = () => {
    startTransition(async () => {
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(newCode.expiresIn));

        const response = await fetch("/api/support-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: newCode.type,
            grantedRole: newCode.type === "ROLE_ELEVATION" ? newCode.grantedRole : undefined,
            expiresAt: expiresAt.toISOString(),
            maxUses: newCode.maxUses ? parseInt(newCode.maxUses) : undefined,
          }),
        });

        if (!response.ok) throw new Error("Failed to create code");

        const created = await response.json();
        setCodes((prev) => [created, ...prev]);
        setIsCreating(false);
        setMessage("Support code created!");
      } catch {
        setMessage("Failed to create code.");
      }
    });
  };

  const handleRevoke = (id: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/support-codes/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to revoke code");

        setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, active: false } : c)));
        setMessage("Code revoked.");
      } catch {
        setMessage("Failed to revoke code.");
      }
    });
  };

  const activeCodes = codes.filter((c) => c.active);
  const expiredCodes = codes.filter((c) => !c.active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Codes</h1>
          <p className="text-muted-foreground mt-1">Generate codes for role elevation</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>Create Code</Button>
      </div>

      {message && (
        <p className={`text-sm ${message.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}

      {/* Active Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Active Codes ({activeCodes.length})</CardTitle>
          <CardDescription>Currently valid support codes</CardDescription>
        </CardHeader>
        <CardContent>
          {activeCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No active codes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCodes.map((code) => (
                <CodeCard key={code.id} code={code} onRevoke={() => handleRevoke(code.id)} isPending={isPending} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expired Codes */}
      {expiredCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expired/Revoked Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expiredCodes.map((code) => (
                <CodeCard key={code.id} code={code} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Support Code</DialogTitle>
            <DialogDescription>Generate a new support code</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code Type</Label>
              <Select
                value={newCode.type}
                onValueChange={(value: string) => setNewCode({ ...newCode, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROLE_ELEVATION">Role Elevation</SelectItem>
                  <SelectItem value="STAFF_ACCESS">Staff Access</SelectItem>
                  <SelectItem value="INVITE">Invite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newCode.type === "ROLE_ELEVATION" && (
              <div className="space-y-2">
                <Label>Granted Role</Label>
                <Select
                  value={newCode.grantedRole}
                  onValueChange={(value: string) => setNewCode({ ...newCode, grantedRole: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRIVER">Driver</SelectItem>
                    <SelectItem value="TC">TC</SelectItem>
                    <SelectItem value="DISPATCHER">Dispatcher</SelectItem>
                    <SelectItem value="SAFETY">Safety</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Expires In (days)</Label>
              <Input
                type="number"
                value={newCode.expiresIn}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCode({ ...newCode, expiresIn: e.target.value })}
                min="1"
                max="365"
              />
            </div>

            <div className="space-y-2">
              <Label>Max Uses (optional)</Label>
              <Input
                type="number"
                value={newCode.maxUses}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCode({ ...newCode, maxUses: e.target.value })}
                placeholder="Unlimited"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CodeCard({
  code,
  onRevoke,
  isPending,
}: {
  code: SupportCode;
  onRevoke?: () => void;
  isPending?: boolean;
}) {
  const isExpired = new Date(code.expiresAt) < new Date();

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <code className="text-lg font-mono font-bold">{code.code}</code>
            <Badge className={code.active && !isExpired ? "bg-green-100 text-green-800" : "bg-gray-100"}>
              {code.active && !isExpired ? "Active" : isExpired ? "Expired" : "Revoked"}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-1 space-y-1">
            <p>Type: {code.type}</p>
            {code.grantedRole && <p>Grants: {code.grantedRole}</p>}
            <p>
              Uses: {code.usedCount}
              {code.maxUses ? ` / ${code.maxUses}` : " (unlimited)"}
            </p>
            <p>Expires: {new Date(code.expiresAt).toLocaleDateString()}</p>
          </div>
        </div>
        {code.active && !isExpired && onRevoke && (
          <Button variant="destructive" size="sm" onClick={onRevoke} disabled={isPending}>
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
}
