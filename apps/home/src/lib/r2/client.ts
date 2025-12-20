/**
 * Cloudflare Images client for uploading and serving organization branding assets.
 *
 * Cloudflare Images handles resizing automatically via variants.
 * We define variants for logo and favicon sizes.
 */

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID!;
const CF_IMAGES_TOKEN = process.env.CF_IMAGES_TOKEN!;

// Cloudflare Images API endpoint
const CF_IMAGES_API = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`;

// Image type definitions (for organizing uploads)
export type ImageType = "logo" | "favicon";

/**
 * Upload an image to Cloudflare Images
 *
 * @param file - The image file to upload
 * @param organizationId - Organization ID for namespacing
 * @param type - Image type (logo or favicon)
 * @returns The Cloudflare Images delivery URL
 */
export async function uploadImage(
  file: File,
  organizationId: string,
  type: ImageType
): Promise<string> {
  if (!CF_ACCOUNT_ID || !CF_IMAGES_TOKEN) {
    throw new Error("Cloudflare Images credentials not configured");
  }

  // Create form data for the upload
  const formData = new FormData();
  formData.append("file", file);

  // Add metadata for organization and type
  formData.append("metadata", JSON.stringify({
    organizationId,
    type,
    uploadedAt: new Date().toISOString(),
  }));

  // Set a custom ID for easier management
  const customId = `${organizationId}/${type}-${Date.now()}`;
  formData.append("id", customId);

  // Upload to Cloudflare Images
  const response = await fetch(CF_IMAGES_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CF_IMAGES_TOKEN}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("[cloudflare-images] Upload failed:", error);
    throw new Error(error.errors?.[0]?.message || "Failed to upload image");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.errors?.[0]?.message || "Upload failed");
  }

  // Return the delivery URL with the appropriate variant
  // Cloudflare Images URL format: https://imagedelivery.net/{account_hash}/{image_id}/{variant}
  const variants = result.result.variants;

  // Cloudflare always returns variant URLs with the correct account hash
  if (!variants || variants.length === 0) {
    throw new Error("No delivery URL returned from Cloudflare Images");
  }

  // Return the first variant URL (contains the public URL with account hash)
  return variants[0];
}

/**
 * Delete an image from Cloudflare Images
 *
 * @param imageId - The Cloudflare Images ID to delete
 */
export async function deleteImage(imageId: string): Promise<void> {
  if (!CF_ACCOUNT_ID || !CF_IMAGES_TOKEN) {
    throw new Error("Cloudflare Images credentials not configured");
  }

  const response = await fetch(`${CF_IMAGES_API}/${imageId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${CF_IMAGES_TOKEN}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("[cloudflare-images] Delete failed:", error);
    // Don't throw on delete failures - image may already be deleted
  }
}

/**
 * Validate that an uploaded file is a valid image
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB (Cloudflare Images limit)
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload a PNG, JPEG, GIF, WebP, or SVG image.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File too large. Maximum size is 10MB.",
    };
  }

  return { valid: true };
}

/**
 * Get the variant URL for an image
 *
 * Cloudflare Images supports variants for different sizes:
 * - "public" - Original image
 * - "logo" - 400x100 fit
 * - "favicon" - 32x32 cover
 *
 * Note: You need to create these variants in the Cloudflare dashboard:
 * 1. Go to Images > Variants
 * 2. Create "logo" variant: Fit within 400x100
 * 3. Create "favicon" variant: Cover 32x32
 */
export function getVariantUrl(baseUrl: string, variant: ImageType): string {
  // Replace the variant name in the URL
  // URL format: https://imagedelivery.net/{hash}/{id}/{variant}
  const parts = baseUrl.split("/");
  parts[parts.length - 1] = variant;
  return parts.join("/");
}
