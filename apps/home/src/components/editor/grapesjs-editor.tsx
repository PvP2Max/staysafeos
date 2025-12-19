"use client";

import { useEffect, useRef, useCallback } from "react";
import grapesjs, { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import gjsPresetWebpage from "grapesjs-preset-webpage";
import gjsBlocksBasic from "grapesjs-blocks-basic";

export type PageBuilderLevel = "none" | "template" | "full";

interface GrapesJSEditorProps {
  // Initial content
  htmlContent?: string;
  cssContent?: string;
  gjsComponents?: unknown;
  gjsStyles?: unknown;
  // Configuration
  pageBuilderLevel: PageBuilderLevel;
  canEditFooter: boolean;
  // Callbacks
  onChange?: (data: {
    html: string;
    css: string;
    components: unknown;
    styles: unknown;
  }) => void;
}

export function GrapesJSEditor({
  htmlContent,
  cssContent,
  gjsComponents,
  gjsStyles,
  pageBuilderLevel,
  canEditFooter,
  onChange,
}: GrapesJSEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get editor output
  const getEditorData = useCallback(() => {
    if (!editorRef.current) return null;
    const editor = editorRef.current;
    return {
      html: editor.getHtml(),
      css: editor.getCss() || "",
      components: editor.getComponents(),
      styles: editor.getStyle(),
    };
  }, []);

  // Initialize GrapesJS
  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const isTemplateMode = pageBuilderLevel === "template";

    const editor = grapesjs.init({
      container: containerRef.current,
      height: "100%",
      width: "auto",
      storageManager: false, // We handle storage ourselves
      plugins: [gjsPresetWebpage, gjsBlocksBasic],
      pluginsOpts: {
        [gjsPresetWebpage as unknown as string]: {
          blocksBasicOpts: {
            blocks: isTemplateMode ? [] : undefined, // Hide blocks in template mode
          },
        },
      },
      // Canvas styling
      canvas: {
        styles: [
          "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
        ],
      },
      // Block manager configuration
      blockManager: {
        appendTo: isTemplateMode ? undefined : "#blocks-container",
      },
      // Style manager configuration
      styleManager: {
        appendTo: "#styles-container",
      },
      // Layer manager
      layerManager: {
        appendTo: "#layers-container",
      },
      // Trait manager
      traitManager: {
        appendTo: "#traits-container",
      },
      // Device manager for responsive design
      deviceManager: {
        devices: [
          { name: "Desktop", width: "" },
          { name: "Tablet", width: "768px", widthMedia: "992px" },
          { name: "Mobile", width: "320px", widthMedia: "480px" },
        ],
      },
    });

    editorRef.current = editor;

    // Load initial content
    if (gjsComponents && gjsStyles) {
      // Load from GrapesJS format (for editing existing pages)
      editor.setComponents(gjsComponents as Parameters<typeof editor.setComponents>[0]);
      editor.setStyle(gjsStyles as Parameters<typeof editor.setStyle>[0]);
    } else if (htmlContent) {
      // Load from HTML/CSS
      editor.setComponents(htmlContent);
      if (cssContent) {
        editor.setStyle(cssContent);
      }
    }

    // Footer protection - prevent editing/removing footer for non-Enterprise
    if (!canEditFooter) {
      // Lock footer components
      editor.on("component:add", (component) => {
        if (component.get("tagName") === "footer" || component.get("type") === "footer") {
          component.set({
            removable: false,
            draggable: false,
            copyable: false,
            editable: false,
            selectable: false,
          });
        }
      });

      // Prevent removal of footer
      editor.on("component:remove:before", (component) => {
        if (component.get("tagName") === "footer" || component.get("type") === "footer") {
          return false;
        }
      });
    }

    // Template mode restrictions - only allow editing text and images
    if (isTemplateMode) {
      // Hide block manager in template mode
      const blockManager = editor.Panels.getPanel("views-container");
      if (blockManager) {
        blockManager.set("visible", false);
      }

      // Disable drag and drop
      editor.on("component:add", (component) => {
        // Prevent adding new components
        if (!component.get("fromTemplate")) {
          component.remove();
        }
      });

      // Allow only text editing
      editor.on("component:selected", (component) => {
        const type = component.get("type");
        // Only allow editing text and image components
        if (type !== "text" && type !== "image" && type !== "link") {
          component.set({
            draggable: false,
            removable: false,
            copyable: false,
          });
        }
      });
    }

    // Notify parent of changes
    editor.on("update", () => {
      const data = getEditorData();
      if (data && onChange) {
        onChange(data);
      }
    });

    // Cleanup
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [htmlContent, cssContent, gjsComponents, gjsStyles, pageBuilderLevel, canEditFooter, onChange, getEditorData]);

  return (
    <div className="grapesjs-editor-container h-[800px] flex">
      {/* Main editor area */}
      <div className="flex-1 flex flex-col">
        <div ref={containerRef} className="flex-1" />
      </div>

      {/* Right sidebar - only show for full mode */}
      {pageBuilderLevel === "full" && (
        <div className="w-64 bg-slate-900 text-white overflow-y-auto">
          <div className="p-2">
            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Blocks</h3>
            <div id="blocks-container" />
          </div>
          <div className="p-2 border-t border-slate-700">
            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Styles</h3>
            <div id="styles-container" />
          </div>
          <div className="p-2 border-t border-slate-700">
            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Layers</h3>
            <div id="layers-container" />
          </div>
          <div className="p-2 border-t border-slate-700">
            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Settings</h3>
            <div id="traits-container" />
          </div>
        </div>
      )}
    </div>
  );
}

// Export a function to get current editor data (for save operations)
export function getGrapesJSData(editor: Editor) {
  return {
    html: editor.getHtml(),
    css: editor.getCss() || "",
    components: editor.getComponents(),
    styles: editor.getStyle(),
  };
}
