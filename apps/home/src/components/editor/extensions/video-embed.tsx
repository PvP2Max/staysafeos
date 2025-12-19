import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";

export interface VideoEmbedAttributes {
  src: string;
  videoId: string;
  provider: "youtube" | "vimeo";
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoEmbed: {
      setVideoEmbed: (url: string) => ReturnType;
    };
  }
}

// Parse YouTube/Vimeo URLs and extract video IDs
function parseVideoUrl(url: string): { videoId: string; provider: "youtube" | "vimeo" } | null {
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return { videoId: match[1], provider: "youtube" };
    }
  }

  // Vimeo patterns
  const vimeoPatterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern);
    if (match) {
      return { videoId: match[1], provider: "vimeo" };
    }
  }

  return null;
}

function getEmbedUrl(videoId: string, provider: "youtube" | "vimeo"): string {
  if (provider === "youtube") {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return `https://player.vimeo.com/video/${videoId}`;
}

export const VideoEmbed = Node.create({
  name: "videoEmbed",

  group: "block",

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: "",
      },
      videoId: {
        default: "",
      },
      provider: {
        default: "youtube",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="video-embed"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { videoId, provider } = HTMLAttributes;
    const embedUrl = getEmbedUrl(videoId, provider);

    return [
      "div",
      mergeAttributes({ "data-type": "video-embed", class: "video-embed-wrapper" }),
      [
        "div",
        { class: "video-embed-container" },
        [
          "iframe",
          {
            src: embedUrl,
            frameborder: "0",
            allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
            allowfullscreen: "true",
          },
        ],
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoEmbedView);
  },

  addCommands() {
    return {
      setVideoEmbed:
        (url: string) =>
        ({ commands }) => {
          const parsed = parseVideoUrl(url);
          if (!parsed) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              src: url,
              videoId: parsed.videoId,
              provider: parsed.provider,
            },
          });
        },
    };
  },
});

// React component for the editor view
function VideoEmbedView({ node, selected }: NodeViewProps) {
  const { videoId, provider } = node.attrs as VideoEmbedAttributes;
  const embedUrl = getEmbedUrl(videoId, provider);

  return (
    <NodeViewWrapper className="video-embed-wrapper">
      <div
        className={`video-embed-container ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
        contentEditable={false}
      >
        <iframe
          src={embedUrl}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </NodeViewWrapper>
  );
}
