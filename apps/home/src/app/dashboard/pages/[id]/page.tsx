import { createApiClient } from "@/lib/api/client";
import { PageEditor } from "./page-editor";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@staysafeos/ui";

interface PageData {
  id: string;
  slug: string;
  title: string;
  blocks: unknown;
  published: boolean;
}

async function getPage(id: string): Promise<PageData | null> {
  try {
    const api = await createApiClient();
    return await api.getPage(id);
  } catch {
    return null;
  }
}

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await getPage(id);

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
      <PageEditor page={page} />
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
