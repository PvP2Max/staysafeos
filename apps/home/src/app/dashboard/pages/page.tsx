import { headers } from "next/headers";
import { PagesManager } from "./pages-manager";
import { getPlanLimits, type PageBuilderLevel } from "@/lib/stripe";

async function fetchPages() {
  // Get the host from headers for internal API call
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  // Forward cookies for authentication
  const cookie = headersList.get("cookie") || "";

  const response = await fetch(`${protocol}://${host}/api/pages`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

async function fetchOrganizationTier(): Promise<{
  pageBuilderLevel: PageBuilderLevel;
  canCreateMultiplePages: boolean;
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
      return { pageBuilderLevel: "none", canCreateMultiplePages: false };
    }

    const me = await response.json();
    const tier = me.ownedTenants?.[0]?.subscriptionTier || "free";
    const limits = getPlanLimits(tier);

    return {
      pageBuilderLevel: limits.pageBuilderLevel,
      canCreateMultiplePages: limits.canCreateMultiplePages,
    };
  } catch {
    return { pageBuilderLevel: "none", canCreateMultiplePages: false };
  }
}

export default async function PagesPage() {
  let pages: Array<{
    id: string;
    slug: string;
    title: string;
    published: boolean;
    editorType?: "tiptap" | "grapesjs";
    isLandingPage?: boolean;
  }> = [];

  const [pagesData, tierInfo] = await Promise.all([
    fetchPages().catch(() => []),
    fetchOrganizationTier(),
  ]);

  pages = pagesData;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Pages</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization&apos;s public pages
        </p>
      </div>

      <PagesManager
        pages={pages}
        pageBuilderLevel={tierInfo.pageBuilderLevel}
        canCreateMultiplePages={tierInfo.canCreateMultiplePages}
      />
    </div>
  );
}
