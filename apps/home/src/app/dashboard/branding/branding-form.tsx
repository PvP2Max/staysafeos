"use client";

import { useState, useTransition, useRef } from "react";
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    file: File,
    type: "logo" | "favicon"
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error(`[upload] ${type} upload error:`, error);
      throw error;
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setMessage("");

    try {
      const url = await handleFileUpload(file, "logo");
      if (url) {
        setFormData({ ...formData, logoUrl: url });
        setMessage("Logo uploaded successfully!");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to upload logo"
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFavicon(true);
    setMessage("");

    try {
      const url = await handleFileUpload(file, "favicon");
      if (url) {
        setFormData({ ...formData, faviconUrl: url });
        setMessage("Favicon uploaded successfully!");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to upload favicon"
      );
    } finally {
      setUploadingFavicon(false);
    }
  };

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
            Upload your organization&apos;s logo and favicon. Images will be automatically resized.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-3">
            <Label>Logo</Label>
            <div className="flex items-start gap-4">
              {/* Logo Preview */}
              <div className="flex-shrink-0 w-48 h-24 border rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
                {formData.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formData.logoUrl}
                    alt="Logo preview"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">No logo</span>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Logo"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG, JPEG, GIF, WebP, or SVG. Max 10MB.
                </p>
                {formData.logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setFormData({ ...formData, logoUrl: "" })}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Favicon Upload */}
          <div className="space-y-3">
            <Label>Favicon</Label>
            <div className="flex items-start gap-4">
              {/* Favicon Preview */}
              <div className="flex-shrink-0 w-16 h-16 border rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
                {formData.faviconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formData.faviconUrl}
                    alt="Favicon preview"
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">No icon</span>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2">
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/x-icon"
                  onChange={handleFaviconChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => faviconInputRef.current?.click()}
                  disabled={uploadingFavicon}
                >
                  {uploadingFavicon ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Favicon"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  PNG, ICO, or other image format. Max 10MB.
                </p>
                {formData.faviconUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setFormData({ ...formData, faviconUrl: "" })}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, primaryColor: e.target.value })
                  }
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, primaryColor: e.target.value })
                  }
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, secondaryColor: e.target.value })
                  }
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, secondaryColor: e.target.value })
                  }
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, tertiaryColor: e.target.value })
                  }
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.tertiaryColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, tertiaryColor: e.target.value })
                  }
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
        <Button type="submit" disabled={isPending || uploadingLogo || uploadingFavicon}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        {message && (
          <p
            className={`text-sm ${
              message.includes("success") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 animate-spin ${className || ""}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
