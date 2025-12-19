"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@staysafeos/ui";

interface DeleteOrgDialogProps {
  organizationId: string;
  organizationName: string;
  trigger?: React.ReactNode;
}

export function DeleteOrgDialog({ organizationId, organizationName, trigger }: DeleteOrgDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState("");

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setConfirmName("");
      setError("");
    }
  }, [open]);

  const handleDelete = () => {
    if (confirmName !== organizationName) {
      setError("Organization name does not match");
      return;
    }

    setError("");
    startTransition(async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to delete organization");
        }

        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete organization");
      }
    });
  };

  const isValid = confirmName === organizationName;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </span>
      ) : (
        <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
          Delete
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete Organization</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <strong>{organizationName}</strong> and all associated data including:
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>All ride records and history</li>
            <li>All team members and their training progress</li>
            <li>All vehicles and shift schedules</li>
            <li>All custom pages and branding</li>
            <li>All support codes and settings</li>
          </ul>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Your statistics will be archived for our records, but all identifiable data will be permanently deleted.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-name">
              Type <strong>{organizationName}</strong> to confirm
            </Label>
            <Input
              id="confirm-name"
              placeholder="Enter organization name"
              value={confirmName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmName(e.target.value)}
              disabled={isPending}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || !isValid}
          >
            {isPending ? "Deleting..." : "Delete Organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
