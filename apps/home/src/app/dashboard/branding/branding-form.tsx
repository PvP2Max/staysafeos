"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
} from "@staysafeos/ui";
import { updateBranding } from "@/lib/api/actions";

interface BrandingFormProps {
  initialData: {
    name: string;
    logoUrl: string;
    faviconUrl: string;
    primaryColor: string;
    secondaryColor: string;
    tertiaryColor: string;
  };
}

export function BrandingForm({ initialData }: BrandingFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState(initialData);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    const fd = new FormData();
    fd.set("logoUrl", formData.logoUrl);
    fd.set("faviconUrl", formData.faviconUrl);
    fd.set("primaryColor", formData.primaryColor);
    fd.set("secondaryColor", formData.secondaryColor);
    fd.set("tertiaryColor", formData.tertiaryColor);

    startTransition(async () => {
      try {
        await updateBranding(fd);
        setMessage("Branding updated successfully!");
      } catch {
        setMessage("Failed to update branding");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo & Favicon */}
      <Card>
        <CardHeader>
          <CardTitle>Logo & Favicon</CardTitle>
          <CardDescription>
            Upload your organization&apos;s logo and favicon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                type="url"
                placeholder="https://example.com/logo.png"
                value={formData.logoUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, logoUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 200x50px PNG with transparent background
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="faviconUrl">Favicon URL</Label>
              <Input
                id="faviconUrl"
                type="url"
                placeholder="https://example.com/favicon.ico"
                value={formData.faviconUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, faviconUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 32x32px ICO or PNG
              </p>
            </div>
          </div>

          {/* Preview */}
          {formData.logoUrl && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">Logo Preview:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.logoUrl}
                alt="Logo preview"
                className="max-h-12 object-contain"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
          <CardDescription>
            Choose your organization&apos;s primary, secondary, and tertiary colors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1"
                  placeholder="#2563eb"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for buttons and links
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="flex-1"
                  placeholder="#64748b"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for secondary elements
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tertiaryColor">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="tertiaryColor"
                  type="color"
                  value={formData.tertiaryColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, tertiaryColor: e.target.value })}
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.tertiaryColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, tertiaryColor: e.target.value })}
                  className="flex-1"
                  placeholder="#f1f5f9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for backgrounds
              </p>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-6 p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-3">Preview:</p>
            <div className="flex gap-4">
              <div
                className="w-20 h-20 rounded-lg shadow"
                style={{ backgroundColor: formData.primaryColor }}
              />
              <div
                className="w-20 h-20 rounded-lg shadow"
                style={{ backgroundColor: formData.secondaryColor }}
              />
              <div
                className="w-20 h-20 rounded-lg shadow border"
                style={{ backgroundColor: formData.tertiaryColor }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        {message && (
          <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
