import { headers } from "next/headers";
import { PagesManager } from "./pages-manager";

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

export default async function PagesPage() {
  let pages: Array<{
    id: string;
    slug: string;
    title: string;
    published: boolean;
  }> = [];

  try {
    pages = await fetchPages();
  } catch {
    // Use empty list if API fails
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Pages</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization&apos;s public pages
        </p>
      </div>

      <PagesManager pages={pages} />
    </div>
  );
}
