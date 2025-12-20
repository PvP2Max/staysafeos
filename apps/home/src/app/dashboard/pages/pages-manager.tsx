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
import { createPage, createPageFromTemplate, deletePage, updatePage, switchPageEditor } from "@/lib/api/actions";
import type { PageBuilderLevel } from "@/lib/stripe";
import { defaultLandingPageTemplate, getTemplateWithBranding } from "@/lib/templates/landing-page";

interface Page {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  editorType?: "tiptap" | "grapesjs";
  isLandingPage?: boolean;
}

interface PagesManagerProps {
  pages: Page[];
  pageBuilderLevel: PageBuilderLevel;
  canCreateMultiplePages: boolean;
}

export function PagesManager({
  pages: initialPages,
  pageBuilderLevel,
  canCreateMultiplePages,
}: PagesManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [pages] = useState(initialPages);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [deletingPage, setDeletingPage] = useState<Page | null>(null);
  const [newPage, setNewPage] = useState({
    slug: "",
    title: "",
    editorType: pageBuilderLevel !== "none" ? "grapesjs" : "tiptap" as "tiptap" | "grapesjs",
    isLandingPage: false,
  });
  const [editTitle, setEditTitle] = useState("");
  const [message, setMessage] = useState("");

  // Check if can create more pages
  // Free/Starter (pageBuilderLevel === "none") cannot create any pages
  const hasLandingPage = pages.some((p) => p.isLandingPage);
  const canCreatePage = pageBuilderLevel !== "none" && (canCreateMultiplePages || !hasLandingPage);

  const handleCreate = () => {
    if (!newPage.slug || !newPage.title) return;

    startTransition(async () => {
      try {
        // For Growth tier landing pages, use the template
        const isCreatingLandingPage =
          pageBuilderLevel !== "none" &&
          !hasLandingPage &&
          newPage.editorType === "grapesjs";

        if (isCreatingLandingPage && pageBuilderLevel === "template") {
          // Growth tier: use pre-built template
          const template = getTemplateWithBranding(defaultLandingPageTemplate);
          await createPageFromTemplate(
            newPage.slug,
            newPage.title,
            template.html,
            template.css,
            template.id,
            true
          );
        } else {
          // Pro/Enterprise or Tiptap: regular creation
          const formData = new FormData();
          formData.set("slug", newPage.slug);
          formData.set("title", newPage.title);
          formData.set("editorType", newPage.editorType);
          formData.set(
            "isLandingPage",
            String(isCreatingLandingPage || newPage.isLandingPage)
          );
          await createPage(formData);
        }

        setIsCreating(false);
        setNewPage({
          slug: "",
          title: "",
          editorType: pageBuilderLevel !== "none" ? "grapesjs" : "tiptap",
          isLandingPage: false,
        });
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
        <div>
          {pageBuilderLevel === "none" && (
            <p className="text-sm text-muted-foreground">
              Upgrade to Growth or higher to access the visual page builder.
            </p>
          )}
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          disabled={!canCreatePage}
          title={!canCreatePage ? "Upgrade to Enterprise for multiple pages" : undefined}
        >
          {pageBuilderLevel !== "none" && !hasLandingPage
            ? "Create Landing Page"
            : "Create Page"}
        </Button>
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
                      {page.isLandingPage && (
                        <Badge variant="outline" className="text-xs">
                          Landing Page
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        {page.editorType === "grapesjs" ? "Visual" : "Text"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">/{page.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    {pageBuilderLevel !== "none" && (
                      <>
                        <Link href={`/dashboard/pages/${page.id}`}>
                          <Button variant="default" size="sm">
                            Edit Content
                          </Button>
                        </Link>
                        {page.editorType === "tiptap" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              startTransition(async () => {
                                try {
                                  await switchPageEditor(page.id, "grapesjs");
                                  setMessage("Switched to visual editor!");
                                } catch {
                                  setMessage("Failed to switch editor");
                                }
                              });
                            }}
                            disabled={isPending}
                          >
                            Switch to Visual
                          </Button>
                        )}
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
                      </>
                    )}
                    {pageBuilderLevel === "none" && (
                      <span className="text-sm text-muted-foreground">
                        Upgrade to edit
                      </span>
                    )}
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
            <DialogTitle>
              {pageBuilderLevel !== "none" && !hasLandingPage
                ? "Create Landing Page"
                : "Create Page"}
            </DialogTitle>
            <DialogDescription>
              {pageBuilderLevel === "template" && !hasLandingPage
                ? "Create your organization's landing page. You'll start with a professional template that you can customize with your own text and images."
                : pageBuilderLevel === "full" && !hasLandingPage
                ? "Create your organization's landing page with the full visual page builder."
                : "Create a new public page for your organization"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                placeholder={pageBuilderLevel !== "none" && !hasLandingPage ? "home" : "about-us"}
                value={newPage.slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewPage({ ...newPage, slug: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                This will be the URL path: /pages/{newPage.slug || "your-slug"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                placeholder={pageBuilderLevel !== "none" && !hasLandingPage ? "Home" : "About Us"}
                value={newPage.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewPage({ ...newPage, title: e.target.value })
                }
              />
            </div>

            {/* Editor type selection - only show if page builder is available */}
            {pageBuilderLevel !== "none" && (
              <div className="space-y-2">
                <Label>Editor Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={newPage.editorType === "grapesjs" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewPage({ ...newPage, editorType: "grapesjs" })}
                  >
                    Visual Editor
                  </Button>
                  <Button
                    type="button"
                    variant={newPage.editorType === "tiptap" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewPage({ ...newPage, editorType: "tiptap" })}
                  >
                    Text Editor
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {newPage.editorType === "grapesjs"
                    ? "Drag-and-drop page builder for creating rich landing pages"
                    : "Simple text editor for content pages"}
                </p>
              </div>
            )}

            {/* Landing page checkbox for non-landing pages when builder available */}
            {pageBuilderLevel !== "none" && hasLandingPage && canCreateMultiplePages && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isLandingPage"
                  checked={newPage.isLandingPage}
                  onChange={(e) =>
                    setNewPage({ ...newPage, isLandingPage: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isLandingPage" className="text-sm font-normal">
                  Set as landing page (replaces current)
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isPending || !newPage.slug || !newPage.title}
            >
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
