import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";

export interface ButtonBlockAttributes {
  text: string;
  href: string;
  variant: "primary" | "secondary" | "outline";
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    ctaButton: {
      setCtaButton: (attributes: ButtonBlockAttributes) => ReturnType;
    };
  }
}

export const ButtonBlock = Node.create({
  name: "ctaButton",

  group: "block",

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      text: {
        default: "Click Here",
      },
      href: {
        default: "#",
      },
      variant: {
        default: "primary",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="cta-button"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { text, href, variant } = HTMLAttributes;

    const variantClasses: Record<string, string> = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    };

    return [
      "div",
      mergeAttributes({ "data-type": "cta-button", class: "cta-button-wrapper" }),
      [
        "a",
        {
          href,
          class: `cta-button inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium transition-colors ${variantClasses[variant] || variantClasses.primary}`,
          target: "_blank",
          rel: "noopener noreferrer",
        },
        text,
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ButtonBlockView);
  },

  addCommands() {
    return {
      setCtaButton:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});

// React component for the editor view
function ButtonBlockView({ node, selected }: NodeViewProps) {
  const { text, href, variant } = node.attrs as ButtonBlockAttributes;

  const variantClasses: Record<string, string> = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border-2 border-primary text-primary bg-transparent",
  };

  return (
    <NodeViewWrapper className="cta-button-wrapper">
      <div
        className={`inline-block rounded-md px-6 py-3 text-sm font-medium cursor-pointer ${
          variantClasses[variant] || variantClasses.primary
        } ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
        contentEditable={false}
      >
        {text}
        <span className="ml-2 text-xs opacity-60">→ {href}</span>
      </div>
    </NodeViewWrapper>
  );
}
