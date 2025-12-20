"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { Button, Badge } from "@staysafeos/ui";
import { GrapesJSEditor, type PageBuilderLevel } from "./grapesjs-editor";
import { updateGrapesJSContent, togglePagePublished } from "@/lib/api/actions";

interface PageData {
  id: string;
  slug: string;
  title: string;
  blocks: unknown;
  published: boolean;
  editorType: "tiptap" | "grapesjs";
  htmlContent?: string;
  cssContent?: string;
  gjsComponents?: unknown;
  gjsStyles?: unknown;
}

interface PageEditorWrapperProps {
  page: PageData;
  pageBuilderLevel: PageBuilderLevel;
  canEditFooter: boolean;
}

export function PageEditorWrapper({
  page,
  pageBuilderLevel,
  canEditFooter,
}: PageEditorWrapperProps) {
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [message, setMessage] = useState("");
  const [isPublished, setIsPublished] = useState(page.published);

  // GrapesJS content state - all pages use GrapesJS now
  const [gjsData, setGjsData] = useState<{
    html: string;
    css: string;
    components: unknown;
    styles: unknown;
  } | null>(null);

  // Track GrapesJS changes
  const handleGrapesJSChange = useCallback(
    (data: { html: string; css: string; components: unknown; styles: unknown }) => {
      setGjsData(data);
      setHasChanges(true);
    },
    []
  );

  // Save content - always use GrapesJS
  const handleSave = useCallback(() => {
    startTransition(async () => {
      try {
        if (gjsData) {
          await updateGrapesJSContent(page.id, gjsData);
        }
        setHasChanges(false);
        setLastSaved(new Date());
        setMessage("Saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } catch {
        setMessage("Failed to save");
      }
    });
  }, [page.id, gjsData]);

  // Toggle publish
  const handleTogglePublish = useCallback(() => {
    startTransition(async () => {
      try {
        await togglePagePublished(page.id, !isPublished);
        setIsPublished(!isPublished);
        setMessage(isPublished ? "Page unpublished" : "Page published!");
        setTimeout(() => setMessage(""), 3000);
      } catch {
        setMessage("Failed to update publish status");
      }
    });
  }, [page.id, isPublished]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges) {
          handleSave();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, handleSave]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
        <div className="flex items-center gap-3">
          <Badge variant={isPublished ? "default" : "secondary"}>
            {isPublished ? "Published" : "Draft"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Visual Editor
          </Badge>
          {hasChanges && (
            <span className="text-sm text-amber-600 font-medium">
              Unsaved changes
            </span>
          )}
          {lastSaved && !hasChanges && (
            <span className="text-sm text-muted-foreground">
              Last saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {message && (
            <span
              className={`text-sm font-medium ${
                message.includes("success") ||
                message.includes("published") ||
                message.includes("Saved")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleTogglePublish}
            disabled={isPending}
          >
            {isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button onClick={handleSave} disabled={isPending || !hasChanges}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Editor - always use GrapesJS */}
      <GrapesJSEditor
        htmlContent={page.htmlContent}
        cssContent={page.cssContent}
        gjsComponents={page.gjsComponents}
        gjsStyles={page.gjsStyles}
        pageBuilderLevel={pageBuilderLevel}
        canEditFooter={canEditFooter}
        onChange={handleGrapesJSChange}
      />

      {/* Help text */}
      <p className="text-sm text-muted-foreground text-center">
        Press{" "}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">
          Cmd/Ctrl + S
        </kbd>{" "}
        to save
      </p>
    </div>
  );
}
