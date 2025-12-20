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
import { Plus, Pencil, Trash2, Loader2, Calendar, Clock, MapPin, Users } from "lucide-react";

interface Shift {
  id: string;
  title: string;
  description?: string;
  role: string;
  startTime: string;
  endTime: string;
  slotsNeeded: number;
  location?: string;
  notes?: string;
  signedUp?: boolean;
  slotsRemaining?: number;
  userSignup?: { id: string } | null;
  signups?: Array<{
    id: string;
    membership?: { account?: { firstName?: string; lastName?: string; email?: string } };
    checkedInAt?: string;
    checkedOutAt?: string;
  }>;
}

interface ShiftManagementProps {
  shifts: Shift[];
  canManage: boolean;
}

export function ShiftManagement({ shifts, canManage }: ShiftManagementProps) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);

  // Group shifts by date
  const shiftsByDate = shifts.reduce((acc, shift) => {
    const date = new Date(shift.startTime).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  const sortedDates = Object.keys(shiftsByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Calculate summary stats
  const totalSlots = shifts.reduce((sum, s) => sum + s.slotsNeeded, 0);
  const filledSlots = shifts.reduce((sum, s) => sum + (s.slotsNeeded - (s.slotsRemaining ?? s.slotsNeeded)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shifts</h1>
          <p className="text-muted-foreground mt-1">
            {canManage ? "Manage volunteer shifts" : "Sign up for volunteer shifts"}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Shift
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Shifts</CardDescription>
            <CardTitle className="text-3xl">{shifts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Slots</CardDescription>
            <CardTitle className="text-3xl">{totalSlots}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={filledSlots === totalSlots ? "bg-green-50 border-green-200" : ""}>
          <CardHeader className="pb-2">
            <CardDescription>Filled Slots</CardDescription>
            <CardTitle className="text-3xl">{filledSlots} / {totalSlots}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Shifts by Date */}
      {sortedDates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No shifts scheduled</p>
            {canManage && (
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add your first shift
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        sortedDates.map((date) => (
          <div key={date}>
            <h2 className="text-lg font-semibold mb-3">
              {new Date(date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <div className="space-y-3">
              {shiftsByDate[date].map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  canManage={canManage}
                  onEdit={() => setEditingShift(shift)}
                  onDelete={() => setDeletingShift(shift)}
                  onRefresh={() => router.refresh()}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Create Dialog */}
      <ShiftDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          setIsCreateOpen(false);
          router.refresh();
        }}
      />

      {/* Edit Dialog */}
      <ShiftDialog
        open={!!editingShift}
        onOpenChange={(open) => !open && setEditingShift(null)}
        shift={editingShift}
        onSuccess={() => {
          setEditingShift(null);
          router.refresh();
        }}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deletingShift} onOpenChange={(open) => !open && setDeletingShift(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shift</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deletingShift?.title}&rdquo;? This action cannot be undone.
              {deletingShift?.signups && deletingShift.signups.length > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: {deletingShift.signups.length} volunteer(s) are signed up for this shift.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingShift(null)}>
              Cancel
            </Button>
            <DeleteShiftButton
              shiftId={deletingShift?.id || ""}
              onSuccess={() => {
                setDeletingShift(null);
                router.refresh();
              }}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShiftCard({
  shift,
  canManage,
  onEdit,
  onDelete,
  onRefresh,
}: {
  shift: Shift;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const startTime = new Date(shift.startTime);
  const endTime = new Date(shift.endTime);
  const slotsRemaining = shift.slotsRemaining ?? shift.slotsNeeded - (shift.signups?.length ?? 0);
  const isFull = slotsRemaining <= 0;
  const isSignedUp = shift.signedUp || !!shift.userSignup;

  const roleColors: Record<string, string> = {
    DRIVER: "bg-yellow-100 text-yellow-800",
    TC: "bg-green-100 text-green-800",
    DISPATCHER: "bg-blue-100 text-blue-800",
    SAFETY: "bg-purple-100 text-purple-800",
  };

  return (
    <Card className={isSignedUp ? "border-primary bg-primary/5" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{shift.title}</CardTitle>
              <Badge className={roleColors[shift.role] || "bg-gray-100"}>{shift.role}</Badge>
            </div>
            {shift.description && (
              <CardDescription className="mt-1">{shift.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isSignedUp && (
              <Badge className="bg-primary text-primary-foreground">Signed Up</Badge>
            )}
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
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {startTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} -{" "}
              {endTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </p>
            {shift.location && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {shift.location}
              </p>
            )}
            <p className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {slotsRemaining} of {shift.slotsNeeded} spots available
            </p>
          </div>
          <ShiftActionButton shift={shift} isFull={isFull} isSignedUp={isSignedUp} onRefresh={onRefresh} />
        </div>

        {/* Show who's signed up */}
        {shift.signups && shift.signups.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Signed up:</p>
            <div className="flex flex-wrap gap-2">
              {shift.signups.map((signup) => {
                const name = signup.membership?.account
                  ? `${signup.membership.account.firstName || ""} ${signup.membership.account.lastName || ""}`.trim() ||
                    signup.membership.account.email
                  : "Unknown";
                return (
                  <span
                    key={signup.id}
                    className={`text-xs px-2 py-1 rounded ${
                      signup.checkedInAt ? "bg-green-100 text-green-800" : "bg-muted"
                    }`}
                  >
                    {name}
                    {signup.checkedInAt && !signup.checkedOutAt && " (checked in)"}
                    {signup.checkedOutAt && " (done)"}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ShiftActionButton({
  shift,
  isFull,
  isSignedUp,
  onRefresh,
}: {
  shift: Shift;
  isFull: boolean;
  isSignedUp: boolean;
  onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleSignup = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/shifts/${shift.id}/signup`, {
          method: "POST",
        });
        if (!response.ok) throw new Error("Failed to sign up");
        onRefresh();
      } catch (error) {
        console.error("Failed to sign up:", error);
      }
    });
  };

  const handleCancelSignup = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/shifts/${shift.id}/signup`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to cancel signup");
        onRefresh();
      } catch (error) {
        console.error("Failed to cancel signup:", error);
      }
    });
  };

  if (isSignedUp) {
    return (
      <Button variant="outline" size="sm" onClick={handleCancelSignup} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel"}
      </Button>
    );
  }

  if (isFull) {
    return (
      <Button variant="outline" size="sm" disabled>
        Full
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={handleSignup} disabled={isPending}>
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Up"}
    </Button>
  );
}

function ShiftDialog({
  open,
  onOpenChange,
  shift,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift?: Shift | null;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Format datetime for input
  const formatDateTimeLocal = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toISOString().slice(0, 16);
  };

  // Default times: today at 6pm - 10pm
  const getDefaultStart = () => {
    const now = new Date();
    now.setHours(18, 0, 0, 0);
    return now.toISOString().slice(0, 16);
  };

  const getDefaultEnd = () => {
    const now = new Date();
    now.setHours(22, 0, 0, 0);
    return now.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    title: shift?.title || "",
    description: shift?.description || "",
    role: shift?.role || "DRIVER",
    startTime: formatDateTimeLocal(shift?.startTime) || getDefaultStart(),
    endTime: formatDateTimeLocal(shift?.endTime) || getDefaultEnd(),
    slotsNeeded: shift?.slotsNeeded?.toString() || "2",
    location: shift?.location || "",
    notes: shift?.notes || "",
  });

  // Reset form when shift changes
  if (shift && formData.title !== shift.title) {
    setFormData({
      title: shift.title,
      description: shift.description || "",
      role: shift.role,
      startTime: formatDateTimeLocal(shift.startTime),
      endTime: formatDateTimeLocal(shift.endTime),
      slotsNeeded: shift.slotsNeeded.toString(),
      location: shift.location || "",
      notes: shift.notes || "",
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("Shift title is required");
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      setError("Start and end times are required");
      return;
    }

    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      setError("End time must be after start time");
      return;
    }

    startTransition(async () => {
      try {
        const url = shift ? `/api/shifts/${shift.id}` : "/api/shifts";
        const method = shift ? "PATCH" : "POST";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            role: formData.role,
            startTime: new Date(formData.startTime).toISOString(),
            endTime: new Date(formData.endTime).toISOString(),
            slotsNeeded: parseInt(formData.slotsNeeded) || 2,
            location: formData.location.trim() || undefined,
            notes: formData.notes.trim() || undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Failed to ${shift ? "update" : "create"} shift`);
        }

        onSuccess();
        if (!shift) {
          setFormData({
            title: "",
            description: "",
            role: "DRIVER",
            startTime: getDefaultStart(),
            endTime: getDefaultEnd(),
            slotsNeeded: "2",
            location: "",
            notes: "",
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to ${shift ? "update" : "create"} shift`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{shift ? "Edit Shift" : "Add Shift"}</DialogTitle>
          <DialogDescription>
            {shift ? "Update shift details" : "Schedule a new volunteer shift"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Friday Night Shift"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRIVER">Driver</SelectItem>
                  <SelectItem value="TC">TC</SelectItem>
                  <SelectItem value="DISPATCHER">Dispatcher</SelectItem>
                  <SelectItem value="SAFETY">Safety</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slotsNeeded">Slots Needed</Label>
              <Input
                id="slotsNeeded"
                type="number"
                min="1"
                max="50"
                value={formData.slotsNeeded}
                onChange={(e) => setFormData((prev) => ({ ...prev, slotsNeeded: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Main Office, Building A"
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
                  {shift ? "Updating..." : "Creating..."}
                </>
              ) : shift ? (
                "Update Shift"
              ) : (
                "Add Shift"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteShiftButton({ shiftId, onSuccess }: { shiftId: string; onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/shifts/${shiftId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete shift");
        }

        onSuccess();
      } catch (error) {
        console.error("Failed to delete shift:", error);
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
