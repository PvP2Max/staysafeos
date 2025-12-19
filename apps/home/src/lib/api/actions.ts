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

  const data = {
    slug: formData.get("slug") as string,
    title: formData.get("title") as string,
  };

  await api.createPage(data);
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
