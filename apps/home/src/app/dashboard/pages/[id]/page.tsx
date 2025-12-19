import { createApiClient } from "@/lib/api/client";
import { PageEditorWrapper } from "@/components/editor/page-editor-wrapper";
import { getPlanLimits, type PageBuilderLevel } from "@/lib/stripe";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@staysafeos/ui";
import { headers } from "next/headers";

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

async function getPage(id: string): Promise<PageData | null> {
  try {
    const api = await createApiClient();
    return await api.getPage(id);
  } catch {
    return null;
  }
}

async function fetchOrganizationTier(): Promise<{
  pageBuilderLevel: PageBuilderLevel;
  canEditFooter: boolean;
}> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const cookie = headersList.get("cookie") || "";

  try {
    const response = await fetch(`${protocol}://${host}/api/me`, {
      headers: { cookie },
      cache: "no-store",
    });

    if (!response.ok) {
      return { pageBuilderLevel: "none", canEditFooter: false };
    }

    const me = await response.json();
    const tier = me.ownedTenants?.[0]?.subscriptionTier || "free";
    const limits = getPlanLimits(tier);

    return {
      pageBuilderLevel: limits.pageBuilderLevel,
      canEditFooter: limits.canEditFooter,
    };
  } catch {
    return { pageBuilderLevel: "none", canEditFooter: false };
  }
}

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [page, tierInfo] = await Promise.all([
    getPage(id),
    fetchOrganizationTier(),
  ]);

  if (!page) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/pages">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon />
              Back to Pages
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{page.title}</h1>
            <p className="text-sm text-muted-foreground">/{page.slug}</p>
          </div>
        </div>
      </div>

      {/* Editor */}
      <PageEditorWrapper
        page={page}
        pageBuilderLevel={tierInfo.pageBuilderLevel}
        canEditFooter={tierInfo.canEditFooter}
      />
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}
