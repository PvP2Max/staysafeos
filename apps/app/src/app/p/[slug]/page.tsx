import { notFound } from "next/navigation";
import { getTenantFromRequest } from "@/lib/tenant";
import { getPublicPage } from "@/lib/api/client";
import { PageRenderer } from "@/components/page-renderer";
import { GrapesJSRenderer } from "@/components/grapesjs-renderer";

interface PublicPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { slug } = await params;

  // Get tenant from subdomain
  const tenantSlug = await getTenantFromRequest();

  if (!tenantSlug) {
    notFound();
  }

  // Fetch the page
  const page = await getPublicPage(tenantSlug, slug);

  if (!page || !page.published) {
    notFound();
  }

  // Render GrapesJS pages differently (full-width, no wrapper)
  if (page.editorType === "grapesjs" && page.htmlContent) {
    return (
      <div className="min-h-screen">
        <GrapesJSRenderer html={page.htmlContent} css={page.cssContent || ""} />
      </div>
    );
  }

  // Render Tiptap pages with article wrapper
  return (
    <div className="min-h-screen bg-background">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">{page.title}</h1>
        </header>
        <div className="prose-container">
          <PageRenderer content={page.content} />
        </div>
      </article>
    </div>
  );
}

export async function generateMetadata({ params }: PublicPageProps) {
  const { slug } = await params;
  const tenantSlug = await getTenantFromRequest();

  if (!tenantSlug) {
    return { title: "Page Not Found" };
  }

  const page = await getPublicPage(tenantSlug, slug);

  if (!page || !page.published) {
    return { title: "Page Not Found" };
  }

  return {
    title: page.title,
    description: `${page.title} - StaySafeOS`,
  };
}
