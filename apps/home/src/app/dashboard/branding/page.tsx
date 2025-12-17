import { createApiClient } from "@/lib/api/client";
import { BrandingForm } from "./branding-form";

export default async function BrandingPage() {
  let tenant = {
    name: "",
    logoUrl: "",
    faviconUrl: "",
    primaryColor: "#2563eb",
    secondaryColor: "#64748b",
    tertiaryColor: "#f1f5f9",
  };

  try {
    const api = await createApiClient();
    const data = await api.getTenant();
    tenant = {
      name: data.name || "",
      logoUrl: data.logoUrl || "",
      faviconUrl: data.faviconUrl || "",
      primaryColor: data.primaryColor || "#2563eb",
      secondaryColor: data.secondaryColor || "#64748b",
      tertiaryColor: data.tertiaryColor || "#f1f5f9",
    };
  } catch {
    // Use defaults if API fails
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Branding</h1>
        <p className="text-muted-foreground mt-1">
          Customize how your organization appears to riders and volunteers
        </p>
      </div>

      <BrandingForm initialData={tenant} />
    </div>
  );
}
