import { createApiClient } from "@/lib/api/client";
import { PagesManager } from "./pages-manager";

export default async function PagesPage() {
  let pages: Array<{
    id: string;
    slug: string;
    title: string;
    published: boolean;
  }> = [];

  try {
    const api = await createApiClient();
    pages = await api.getPages();
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
