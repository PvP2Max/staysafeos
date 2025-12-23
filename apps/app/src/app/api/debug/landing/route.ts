import { NextResponse } from "next/server";
import { getTenantFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL || "https://api.staysafeos.com";

export async function GET() {
  try {
    const tenantSlug = await getTenantFromRequest();

    if (!tenantSlug) {
      return NextResponse.json({
        error: "No tenant slug resolved",
        tenantSlug: null,
      });
    }

    // Fetch tenant info
    let tenant = null;
    let tenantError = null;
    try {
      const response = await fetch(`${API_URL}/v1/tenants/${tenantSlug}`, {
        cache: "no-store",
      });
      if (response.ok) {
        tenant = await response.json();
      } else {
        tenantError = `Status ${response.status}: ${await response.text()}`;
      }
    } catch (e) {
      tenantError = e instanceof Error ? e.message : "Unknown error";
    }

    // Check tier
    const tierHasPages = tenant?.subscriptionTier
      ? ["growth", "pro", "enterprise"].includes(tenant.subscriptionTier)
      : false;

    // Fetch landing page
    let landingPage = null;
    let landingPageError = null;
    try {
      const response = await fetch(`${API_URL}/v1/pages/public/${tenantSlug}/home`, {
        cache: "no-store",
      });
      if (response.ok) {
        landingPage = await response.json();
      } else {
        landingPageError = `Status ${response.status}: ${await response.text()}`;
      }
    } catch (e) {
      landingPageError = e instanceof Error ? e.message : "Unknown error";
    }

    // Determine what would be shown
    let wouldShow = "simple-signin";
    if (tierHasPages && landingPage?.published && landingPage?.htmlContent) {
      wouldShow = "custom-landing-page";
    }

    return NextResponse.json({
      tenantSlug,
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        subscriptionTier: tenant.subscriptionTier,
      } : null,
      tenantError,
      tierHasPages,
      landingPage: landingPage ? {
        slug: landingPage.slug,
        title: landingPage.title,
        published: landingPage.published,
        editorType: landingPage.editorType,
        hasHtmlContent: !!landingPage.htmlContent,
        htmlContentLength: landingPage.htmlContent?.length || 0,
      } : null,
      landingPageError,
      wouldShow,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
