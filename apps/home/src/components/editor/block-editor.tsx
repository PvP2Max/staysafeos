"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { ButtonBlock } from "./extensions/button-block";
import { VideoEmbed } from "./extensions/video-embed";
import { EditorToolbar } from "./editor-toolbar";
import "./editor.css";

interface BlockEditorProps {
  content?: unknown;
  onChange?: (content: unknown) => void;
  editable?: boolean;
}

export function BlockEditor({ content, onChange, editable = true }: BlockEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "editor-link",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your page content...",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      ButtonBlock,
      VideoEmbed,
    ],
    content: content as Parameters<typeof useEditor>[0]["content"],
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "editor-content prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] p-4",
      },
    },
  });

  if (!editor) {
    return (
      <div className="border rounded-lg p-4 bg-muted/20 animate-pulse">
        <div className="h-10 bg-muted rounded mb-4" />
        <div className="h-64 bg-muted/50 rounded" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {editable && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

export function getEditorContent(editor: ReturnType<typeof useEditor>) {
  return editor?.getJSON();
}
