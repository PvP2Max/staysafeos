"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@staysafeos/ui";
import { createPage, deletePage, updatePage } from "@/lib/api/actions";

interface Page {
  id: string;
  slug: string;
  title: string;
  published: boolean;
}

interface PagesManagerProps {
  pages: Page[];
}

export function PagesManager({ pages: initialPages }: PagesManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [pages] = useState(initialPages);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [deletingPage, setDeletingPage] = useState<Page | null>(null);
  const [newPage, setNewPage] = useState({ slug: "", title: "" });
  const [editTitle, setEditTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleCreate = () => {
    if (!newPage.slug || !newPage.title) return;

    const formData = new FormData();
    formData.set("slug", newPage.slug);
    formData.set("title", newPage.title);

    startTransition(async () => {
      try {
        await createPage(formData);
        setIsCreating(false);
        setNewPage({ slug: "", title: "" });
        setMessage("Page created successfully!");
      } catch {
        setMessage("Failed to create page");
      }
    });
  };

  const handleUpdate = () => {
    if (!editingPage || !editTitle) return;

    const formData = new FormData();
    formData.set("title", editTitle);
    formData.set("published", String(editingPage.published));

    startTransition(async () => {
      try {
        await updatePage(editingPage.id, formData);
        setEditingPage(null);
        setEditTitle("");
        setMessage("Page updated successfully!");
      } catch {
        setMessage("Failed to update page");
      }
    });
  };

  const handleDelete = () => {
    if (!deletingPage) return;

    startTransition(async () => {
      try {
        await deletePage(deletingPage.id);
        setDeletingPage(null);
        setMessage("Page deleted successfully!");
      } catch {
        setMessage("Failed to delete page");
      }
    });
  };

  const togglePublished = (page: Page) => {
    const formData = new FormData();
    formData.set("title", page.title);
    formData.set("published", String(!page.published));

    startTransition(async () => {
      try {
        await updatePage(page.id, formData);
        setMessage(`Page ${!page.published ? "published" : "unpublished"}!`);
      } catch {
        setMessage("Failed to update page");
      }
    });
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div />
        <Button onClick={() => setIsCreating(true)}>Create Page</Button>
      </div>

      {message && (
        <p className={`text-sm ${message.includes("success") || message.includes("published") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Pages ({pages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No pages yet. Create your first page to get started.
            </p>
          ) : (
            <div className="divide-y">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{page.title}</p>
                      <Badge variant={page.published ? "default" : "secondary"}>
                        {page.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">/{page.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/pages/${page.id}`}>
                      <Button variant="default" size="sm">
                        Edit Content
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublished(page)}
                      disabled={isPending}
                    >
                      {page.published ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPage(page);
                        setEditTitle(page.title);
                      }}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeletingPage(page)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Page Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Page</DialogTitle>
            <DialogDescription>
              Create a new public page for your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                placeholder="about-us"
                value={newPage.slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPage({ ...newPage, slug: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                This will be the URL path: /pages/{newPage.slug || "your-slug"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                placeholder="About Us"
                value={newPage.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPage({ ...newPage, title: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending || !newPage.slug || !newPage.title}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Page Dialog */}
      <Dialog open={!!editingPage} onOpenChange={() => setEditingPage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
            <DialogDescription>
              Update the page title
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Page Title</Label>
              <Input
                id="editTitle"
                value={editTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPage(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isPending || !editTitle}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingPage} onOpenChange={() => setDeletingPage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deletingPage?.title}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingPage(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
