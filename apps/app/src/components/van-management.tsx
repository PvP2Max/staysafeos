"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from "@staysafeos/ui";
import { Plus, Pencil, Trash2, Loader2, Truck } from "lucide-react";

interface Van {
  id: string;
  name: string;
  capacity: number;
  licensePlate?: string;
  status: string;
  lat?: number;
  lng?: number;
  lastPing?: string;
  driver?: { account?: { firstName?: string; lastName?: string } };
  tc?: { account?: { firstName?: string; lastName?: string } };
}

interface VanManagementProps {
  vans: Van[];
  canManage: boolean;
}

export function VanManagement({ vans, canManage }: VanManagementProps) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVan, setEditingVan] = useState<Van | null>(null);
  const [deletingVan, setDeletingVan] = useState<Van | null>(null);

  const statusCounts = vans.reduce((acc, van) => {
    acc[van.status] = (acc[van.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fleet</h1>
          <p className="text-muted-foreground mt-1">Van status and assignments</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Van
          </Button>
        )}
      </div>

      {/* Status Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatusCard status="AVAILABLE" count={statusCounts["AVAILABLE"] || 0} color="green" />
        <StatusCard status="IN_USE" count={statusCounts["IN_USE"] || 0} color="blue" />
        <StatusCard status="MAINTENANCE" count={statusCounts["MAINTENANCE"] || 0} color="yellow" />
        <StatusCard status="OFFLINE" count={statusCounts["OFFLINE"] || 0} color="gray" />
      </div>

      {/* Van Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vans.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="text-center py-12 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No vans in fleet</p>
              {canManage && (
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first van
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          vans.map((van) => (
            <VanCard
              key={van.id}
              van={van}
              canManage={canManage}
              onEdit={() => setEditingVan(van)}
              onDelete={() => setDeletingVan(van)}
            />
          ))
        )}
      </div>

      {/* Create Dialog */}
      <VanDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          setIsCreateOpen(false);
          router.refresh();
        }}
      />

      {/* Edit Dialog */}
      <VanDialog
        open={!!editingVan}
        onOpenChange={(open) => !open && setEditingVan(null)}
        van={editingVan}
        onSuccess={() => {
          setEditingVan(null);
          router.refresh();
        }}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deletingVan} onOpenChange={(open) => !open && setDeletingVan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Van</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingVan?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingVan(null)}>
              Cancel
            </Button>
            <DeleteVanButton
              vanId={deletingVan?.id || ""}
              onSuccess={() => {
                setDeletingVan(null);
                router.refresh();
              }}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusCard({
  status,
  count,
  color,
}: {
  status: string;
  count: number;
  color: "green" | "blue" | "yellow" | "gray";
}) {
  const colorClasses = {
    green: "bg-green-50 border-green-200",
    blue: "bg-blue-50 border-blue-200",
    yellow: "bg-yellow-50 border-yellow-200",
    gray: "bg-gray-50 border-gray-200",
  };

  return (
    <Card className={colorClasses[color]}>
      <CardHeader className="pb-2">
        <CardDescription>{status}</CardDescription>
        <CardTitle className="text-3xl">{count}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function VanCard({
  van,
  canManage,
  onEdit,
  onDelete,
}: {
  van: Van;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusColors: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-800",
    IN_USE: "bg-blue-100 text-blue-800",
    MAINTENANCE: "bg-yellow-100 text-yellow-800",
    OFFLINE: "bg-gray-100 text-gray-800",
  };

  const driverName = van.driver?.account
    ? `${van.driver.account.firstName || ""} ${van.driver.account.lastName || ""}`.trim()
    : undefined;
  const tcName = van.tc?.account
    ? `${van.tc.account.firstName || ""} ${van.tc.account.lastName || ""}`.trim()
    : undefined;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{van.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[van.status]}>{van.status}</Badge>
            {canManage && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        {van.licensePlate && <CardDescription>{van.licensePlate}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">
          <span className="text-muted-foreground">Capacity:</span> {van.capacity}
        </p>
        {driverName && (
          <p className="text-sm">
            <span className="text-muted-foreground">Driver:</span> {driverName}
          </p>
        )}
        {tcName && (
          <p className="text-sm">
            <span className="text-muted-foreground">TC:</span> {tcName}
          </p>
        )}
        {van.lastPing && (
          <p className="text-xs text-muted-foreground">
            Last ping: {new Date(van.lastPing).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function VanDialog({
  open,
  onOpenChange,
  van,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  van?: Van | null;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: van?.name || "",
    capacity: van?.capacity?.toString() || "6",
    licensePlate: van?.licensePlate || "",
    status: van?.status || "AVAILABLE",
  });

  // Reset form when van changes
  if (van && formData.name !== van.name) {
    setFormData({
      name: van.name,
      capacity: van.capacity.toString(),
      licensePlate: van.licensePlate || "",
      status: van.status,
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Van name is required");
      return;
    }

    startTransition(async () => {
      try {
        const url = van ? `/api/vans/${van.id}` : "/api/vans";
        const method = van ? "PATCH" : "POST";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            capacity: parseInt(formData.capacity) || 6,
            licensePlate: formData.licensePlate.trim() || undefined,
            status: formData.status,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Failed to ${van ? "update" : "create"} van`);
        }

        onSuccess();
        if (!van) {
          setFormData({ name: "", capacity: "6", licensePlate: "", status: "AVAILABLE" });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to ${van ? "update" : "create"} van`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{van ? "Edit Van" : "Add Van"}</DialogTitle>
          <DialogDescription>
            {van ? "Update van details" : "Add a new van to your fleet"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Van 1, Blue Van"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="50"
                value={formData.capacity}
                onChange={(e) => setFormData((prev) => ({ ...prev, capacity: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="IN_USE">In Use</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="OFFLINE">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="licensePlate">License Plate</Label>
            <Input
              id="licensePlate"
              value={formData.licensePlate}
              onChange={(e) => setFormData((prev) => ({ ...prev, licensePlate: e.target.value }))}
              placeholder="e.g., ABC-1234"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {van ? "Updating..." : "Creating..."}
                </>
              ) : van ? (
                "Update Van"
              ) : (
                "Add Van"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteVanButton({ vanId, onSuccess }: { vanId: string; onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/vans/${vanId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete van");
        }

        onSuccess();
      } catch (error) {
        console.error("Failed to delete van:", error);
      }
    });
  };

  return (
    <Button onClick={handleDelete} disabled={isPending} variant="destructive">
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Deleting...
        </>
      ) : (
        "Delete"
      )}
    </Button>
  );
}
