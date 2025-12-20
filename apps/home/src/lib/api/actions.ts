"use server";

/**
 * Server Actions for Home Dashboard
 * These can be called from client components
 */

import { revalidatePath } from "next/cache";
import { createApiClient } from "./client";

// Tenant/Branding actions
export async function updateBranding(formData: FormData) {
  const api = await createApiClient();

  const data = {
    logoUrl: formData.get("logoUrl") as string | undefined,
    faviconUrl: formData.get("faviconUrl") as string | undefined,
    primaryColor: formData.get("primaryColor") as string | undefined,
    secondaryColor: formData.get("secondaryColor") as string | undefined,
    tertiaryColor: formData.get("tertiaryColor") as string | undefined,
  };

  // Filter out undefined values
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

  await api.updateTenant(filteredData);
  revalidatePath("/dashboard/branding");
  return { success: true };
}

export async function updateTenantName(name: string) {
  const api = await createApiClient();
  await api.updateTenant({ name });
  revalidatePath("/dashboard");
  return { success: true };
}

// Feature toggles
export async function updateFeatures(features: Record<string, boolean>) {
  const api = await createApiClient();
  await api.updateFeatures(features);
  revalidatePath("/dashboard/settings");
  return { success: true };
}

// Member management
export async function updateMemberRole(membershipId: string, role: string) {
  const api = await createApiClient();
  await api.updateMemberRole(membershipId, role);
  revalidatePath("/dashboard/members");
  return { success: true };
}

export async function removeMember(membershipId: string) {
  const api = await createApiClient();
  await api.removeMember(membershipId);
  revalidatePath("/dashboard/members");
  return { success: true };
}

// Page management
export async function createPage(formData: FormData) {
  const api = await createApiClient();

  const editorType = formData.get("editorType") as "tiptap" | "grapesjs" | null;
  const isLandingPage = formData.get("isLandingPage") === "true";
  const templateId = formData.get("templateId") as string | null;
  const htmlContent = formData.get("htmlContent") as string | null;
  const cssContent = formData.get("cssContent") as string | null;

  const data: Parameters<typeof api.createPage>[0] = {
    slug: formData.get("slug") as string,
    title: formData.get("title") as string,
    editorType: editorType || "tiptap",
    isLandingPage,
  };

  if (templateId) data.templateId = templateId;
  if (htmlContent) data.htmlContent = htmlContent;
  if (cssContent) data.cssContent = cssContent;

  await api.createPage(data);
  revalidatePath("/dashboard/pages");
  return { success: true };
}

export async function createPageFromTemplate(
  slug: string,
  title: string,
  templateHtml: string,
  templateCss: string,
  templateId: string,
  isLandingPage: boolean = true
) {
  const api = await createApiClient();

  await api.createPage({
    slug,
    title,
    editorType: "grapesjs",
    htmlContent: templateHtml,
    cssContent: templateCss,
    templateId,
    isLandingPage,
  });

  revalidatePath("/dashboard/pages");
  return { success: true };
}

export async function updatePage(id: string, formData: FormData) {
  const api = await createApiClient();

  const data = {
    title: formData.get("title") as string | undefined,
    published: formData.get("published") === "true",
  };

  await api.updatePage(id, data);
  revalidatePath("/dashboard/pages");
  return { success: true };
}

export async function deletePage(id: string) {
  const api = await createApiClient();
  await api.deletePage(id);
  revalidatePath("/dashboard/pages");
  return { success: true };
}

export async function updatePageContent(id: string, blocks: unknown) {
  const api = await createApiClient();
  await api.updatePage(id, { blocks });
  revalidatePath("/dashboard/pages");
  revalidatePath(`/dashboard/pages/${id}`);
  return { success: true };
}

export async function updateGrapesJSContent(
  id: string,
  data: {
    html: string;
    css: string;
    components: unknown;
    styles: unknown;
  }
) {
  const api = await createApiClient();
  await api.updatePage(id, {
    htmlContent: data.html,
    cssContent: data.css,
    gjsComponents: data.components,
    gjsStyles: data.styles,
  });
  revalidatePath("/dashboard/pages");
  revalidatePath(`/dashboard/pages/${id}`);
  return { success: true };
}

export async function togglePagePublished(id: string, published: boolean) {
  const api = await createApiClient();
  await api.updatePage(id, { published });
  revalidatePath("/dashboard/pages");
  revalidatePath(`/dashboard/pages/${id}`);
  return { success: true };
}

// Van management
export async function createVan(formData: FormData) {
  const api = await createApiClient();

  const data = {
    name: formData.get("name") as string,
    capacity: formData.get("capacity") ? Number(formData.get("capacity")) : undefined,
    licensePlate: formData.get("licensePlate") as string | undefined,
  };

  await api.createVan(data);
  revalidatePath("/dashboard/fleet");
  return { success: true };
}

export async function updateVan(id: string, formData: FormData) {
  const api = await createApiClient();

  const data = {
    name: formData.get("name") as string | undefined,
    capacity: formData.get("capacity") ? Number(formData.get("capacity")) : undefined,
    licensePlate: formData.get("licensePlate") as string | undefined,
    status: formData.get("status") as string | undefined,
  };

  // Filter out undefined values
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

  await api.updateVan(id, filteredData);
  revalidatePath("/dashboard/fleet");
  return { success: true };
}

export async function deleteVan(id: string) {
  const api = await createApiClient();
  await api.deleteVan(id);
  revalidatePath("/dashboard/fleet");
  return { success: true };
}

// Domain management
export async function addDomain(domain: string, isPrimary: boolean = false) {
  try {
    const api = await createApiClient();
    const result = await api.addDomain({ domain, isPrimary });
    revalidatePath("/dashboard/domains");
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add domain";
    throw new Error(message);
  }
}

export async function verifyDomain(id: string) {
  try {
    const api = await createApiClient();
    const result = await api.verifyDomain(id);
    revalidatePath("/dashboard/domains");
    return { success: true, data: result };
  } catch (error) {
    // Return a user-friendly error message for DNS verification failures
    const message = error instanceof Error ? error.message : "Verification failed";
    if (message.includes("DNS verification failed")) {
      return {
        success: false,
        error: "DNS records not found or not propagated yet. Please check your DNS configuration and try again in a few minutes."
      };
    }
    return { success: false, error: message };
  }
}

export async function setPrimaryDomain(id: string) {
  try {
    const api = await createApiClient();
    await api.setPrimaryDomain(id);
    revalidatePath("/dashboard/domains");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to set primary domain";
    throw new Error(message);
  }
}

export async function deleteDomain(id: string) {
  try {
    const api = await createApiClient();
    await api.deleteDomain(id);
    revalidatePath("/dashboard/domains");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete domain";
    throw new Error(message);
  }
}
