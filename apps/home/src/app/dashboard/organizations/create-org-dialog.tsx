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

interface CreateOrgDialogProps {
  children?: React.ReactNode;
}

export function CreateOrgDialog({ children }: CreateOrgDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [error, setError] = useState("");

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setSlugAvailable(null);
      setError("");
    }
  }, [open]);

  // Auto-generate slug from name if user hasn't manually edited it
  useEffect(() => {
    if (!slugTouched && name) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50);
      setSlug(generated);
    }
  }, [name, slugTouched]);

  // Check slug availability with debounce
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSlugChecking(true);
      try {
        const response = await fetch(`/api/tenants/check-slug?slug=${encodeURIComponent(slug)}`);
        if (response.ok) {
          const result = await response.json();
          setSlugAvailable(result.available);
        } else {
          setSlugAvailable(null);
        }
      } catch {
        setSlugAvailable(null);
      } finally {
        setSlugChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Organization name is required");
      return;
    }

    if (!slug || slug.length < 3) {
      setError("Slug must be at least 3 characters");
      return;
    }

    if (slugAvailable === false) {
      setError("This slug is already taken");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/tenants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), slug }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to create organization");
        }

        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create organization");
      }
    });
  };

  const isValid = name.trim() && slug.length >= 3 && slugAvailable !== false;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <span onClick={() => setOpen(true)}>{children}</span>
      ) : (
        <Button onClick={() => setOpen(true)}>Create Organization</Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Set up a new organization on StaySafeOS
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="My Safe Rides Program"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-slug">
                URL Slug
                {slugChecking && (
                  <span className="ml-2 text-xs text-muted-foreground">Checking...</span>
                )}
                {!slugChecking && slugAvailable === true && (
                  <span className="ml-2 text-xs text-green-600">Available</span>
                )}
                {!slugChecking && slugAvailable === false && (
                  <span className="ml-2 text-xs text-red-600">Taken</span>
                )}
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  id="org-slug"
                  placeholder="my-org"
                  value={slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSlugTouched(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                  }}
                  disabled={isPending}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  .staysafeos.com
                </span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !isValid}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
