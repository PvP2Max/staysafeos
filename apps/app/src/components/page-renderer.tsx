import type { TiptapDoc, TiptapNode, TiptapMark } from "@/lib/api/client";

interface PageRendererProps {
  content: TiptapDoc;
}

export function PageRenderer({ content }: PageRendererProps) {
  return (
    <div className="prose prose-sm sm:prose-base max-w-none">
      {content.content.map((node, index) => (
        <RenderNode key={index} node={node} />
      ))}
    </div>
  );
}

function RenderNode({ node }: { node: TiptapNode }) {
  switch (node.type) {
    case "heading":
      return <RenderHeading node={node} />;
    case "paragraph":
      return <RenderParagraph node={node} />;
    case "bulletList":
      return <RenderBulletList node={node} />;
    case "orderedList":
      return <RenderOrderedList node={node} />;
    case "listItem":
      return <RenderListItem node={node} />;
    case "blockquote":
      return <RenderBlockquote node={node} />;
    case "horizontalRule":
      return <hr className="my-6 border-t border-border" />;
    case "image":
      return <RenderImage node={node} />;
    case "codeBlock":
      return <RenderCodeBlock node={node} />;
    case "ctaButton":
      return <RenderCtaButton node={node} />;
    case "videoEmbed":
      return <RenderVideoEmbed node={node} />;
    case "hardBreak":
      return <br />;
    case "text":
      return <RenderText node={node} />;
    default:
      // For unknown node types, try to render children
      if (node.content) {
        return (
          <>
            {node.content.map((child, index) => (
              <RenderNode key={index} node={child} />
            ))}
          </>
        );
      }
      return null;
  }
}

function RenderHeading({ node }: { node: TiptapNode }) {
  const level = (node.attrs?.level as number) || 1;
  const style = getTextAlignStyle(node.attrs?.textAlign as string | undefined);
  const children = node.content?.map((child, index) => (
    <RenderNode key={index} node={child} />
  ));

  switch (level) {
    case 1:
      return <h1 style={style} className="text-3xl font-bold mt-6 mb-3">{children}</h1>;
    case 2:
      return <h2 style={style} className="text-2xl font-semibold mt-5 mb-2">{children}</h2>;
    case 3:
      return <h3 style={style} className="text-xl font-semibold mt-4 mb-2">{children}</h3>;
    default:
      return <h4 style={style} className="text-lg font-medium mt-3 mb-2">{children}</h4>;
  }
}

function RenderParagraph({ node }: { node: TiptapNode }) {
  const style = getTextAlignStyle(node.attrs?.textAlign as string | undefined);
  return (
    <p style={style} className="mb-4 leading-relaxed">
      {node.content?.map((child, index) => (
        <RenderNode key={index} node={child} />
      ))}
    </p>
  );
}

function RenderBulletList({ node }: { node: TiptapNode }) {
  return (
    <ul className="list-disc pl-6 mb-4 space-y-1">
      {node.content?.map((child, index) => (
        <RenderNode key={index} node={child} />
      ))}
    </ul>
  );
}

function RenderOrderedList({ node }: { node: TiptapNode }) {
  return (
    <ol className="list-decimal pl-6 mb-4 space-y-1">
      {node.content?.map((child, index) => (
        <RenderNode key={index} node={child} />
      ))}
    </ol>
  );
}

function RenderListItem({ node }: { node: TiptapNode }) {
  return (
    <li>
      {node.content?.map((child, index) => (
        <RenderNode key={index} node={child} />
      ))}
    </li>
  );
}

function RenderBlockquote({ node }: { node: TiptapNode }) {
  return (
    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
      {node.content?.map((child, index) => (
        <RenderNode key={index} node={child} />
      ))}
    </blockquote>
  );
}

function RenderImage({ node }: { node: TiptapNode }) {
  const src = node.attrs?.src as string;
  const alt = (node.attrs?.alt as string) || "";
  const title = node.attrs?.title as string | undefined;

  if (!src) return null;

  return (
    <figure className="my-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        title={title}
        className="max-w-full h-auto rounded-lg"
      />
      {title && (
        <figcaption className="text-sm text-muted-foreground mt-2 text-center">
          {title}
        </figcaption>
      )}
    </figure>
  );
}

function RenderCodeBlock({ node }: { node: TiptapNode }) {
  const code = node.content?.map((child) => child.text || "").join("") || "";
  return (
    <pre className="bg-muted rounded-lg p-4 overflow-x-auto my-4">
      <code className="text-sm font-mono">{code}</code>
    </pre>
  );
}

function RenderCtaButton({ node }: { node: TiptapNode }) {
  const text = (node.attrs?.text as string) || "Click Here";
  const href = (node.attrs?.href as string) || "#";
  const variant = (node.attrs?.variant as string) || "primary";

  const variantClasses: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <div className="my-6">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium transition-colors ${variantClasses[variant] || variantClasses.primary}`}
      >
        {text}
      </a>
    </div>
  );
}

function RenderVideoEmbed({ node }: { node: TiptapNode }) {
  const videoId = node.attrs?.videoId as string;
  const provider = (node.attrs?.provider as string) || "youtube";

  if (!videoId) return null;

  const embedUrl =
    provider === "youtube"
      ? `https://www.youtube.com/embed/${videoId}`
      : `https://player.vimeo.com/video/${videoId}`;

  return (
    <div className="my-6">
      <div className="relative w-full pb-[56.25%] h-0 overflow-hidden rounded-lg bg-muted">
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

function RenderText({ node }: { node: TiptapNode }) {
  if (!node.text) return null;

  let element: React.ReactNode = node.text;

  // Apply marks (bold, italic, underline, link, etc.)
  if (node.marks) {
    for (const mark of node.marks) {
      element = applyMark(element, mark);
    }
  }

  return <>{element}</>;
}

function applyMark(content: React.ReactNode, mark: TiptapMark): React.ReactNode {
  switch (mark.type) {
    case "bold":
      return <strong>{content}</strong>;
    case "italic":
      return <em>{content}</em>;
    case "underline":
      return <u>{content}</u>;
    case "strike":
      return <s>{content}</s>;
    case "code":
      return <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{content}</code>;
    case "link":
      return (
        <a
          href={mark.attrs?.href as string}
          target={mark.attrs?.target as string | undefined}
          rel="noopener noreferrer"
          className="text-primary underline hover:no-underline"
        >
          {content}
        </a>
      );
    default:
      return content;
  }
}

function getTextAlignStyle(textAlign: string | undefined): React.CSSProperties | undefined {
  if (!textAlign || textAlign === "left") return undefined;
  return { textAlign: textAlign as "center" | "right" | "justify" };
}
