/**
 * Renders GrapesJS page content (HTML + CSS)
 * Uses scoped styles to prevent CSS bleeding
 */

interface GrapesJSRendererProps {
  html: string;
  css: string;
}

export function GrapesJSRenderer({ html, css }: GrapesJSRendererProps) {
  // Generate a unique scope ID to prevent style bleeding
  const scopeId = `gjs-page-${Math.random().toString(36).substring(2, 9)}`;

  // Scope the CSS by prepending each rule with the scope ID
  const scopedCss = scopeCss(css, `#${scopeId}`);

  return (
    <>
      {/* Inject scoped styles */}
      <style dangerouslySetInnerHTML={{ __html: scopedCss }} />

      {/* Render the HTML content */}
      <div
        id={scopeId}
        className="gjs-rendered-page"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}

/**
 * Scope CSS rules by prepending a selector
 * This prevents styles from bleeding into the rest of the page
 */
function scopeCss(css: string, scopeSelector: string): string {
  if (!css) return "";

  // Split CSS into rules and scope each one
  return css
    .replace(/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g, (match, selector, after) => {
      // Don't scope @rules like @media, @keyframes, etc.
      if (selector.trim().startsWith("@")) {
        return match;
      }

      // Don't scope :root or html or body
      const trimmedSelector = selector.trim();
      if (
        trimmedSelector === ":root" ||
        trimmedSelector === "html" ||
        trimmedSelector === "body"
      ) {
        // Replace with scoped selector
        return `${scopeSelector}${after}`;
      }

      // Handle multiple selectors (comma-separated)
      const selectors = selector.split(",").map((s: string) => {
        const trimmed = s.trim();
        if (!trimmed) return s;

        // Don't double-scope
        if (trimmed.startsWith(scopeSelector)) {
          return s;
        }

        return `${scopeSelector} ${trimmed}`;
      });

      return selectors.join(",") + after;
    });
}
