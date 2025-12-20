import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

// R2 configuration from environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "staysafeos-assets";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!; // e.g., https://pub-xxx.r2.dev

// Image dimension presets
export const IMAGE_PRESETS = {
  logo: { width: 400, height: 100, format: "png" as const },
  favicon: { width: 32, height: 32, format: "png" as const },
} as const;

type ImageType = keyof typeof IMAGE_PRESETS;

// Create S3 client configured for R2
function getR2Client(): S3Client {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 credentials not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Process and resize an image to the specified dimensions
 */
async function processImage(
  buffer: Buffer,
  type: ImageType
): Promise<Buffer> {
  const preset = IMAGE_PRESETS[type];

  let processor = sharp(buffer);

  // For logos, resize to fit within bounds while maintaining aspect ratio
  if (type === "logo") {
    processor = processor.resize(preset.width, preset.height, {
      fit: "inside",
      withoutEnlargement: true,
    });
  } else {
    // For favicons, resize to exact dimensions (square)
    processor = processor.resize(preset.width, preset.height, {
      fit: "cover",
      position: "center",
    });
  }

  // Convert to PNG with transparency support
  return processor.png({ quality: 90 }).toBuffer();
}

/**
 * Upload an image to R2 with automatic resizing
 */
export async function uploadImage(
  file: File,
  organizationId: string,
  type: ImageType
): Promise<string> {
  const client = getR2Client();

  // Read file as buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Process and resize the image
  const processedBuffer = await processImage(buffer, type);

  // Generate unique filename
  const timestamp = Date.now();
  const key = `organizations/${organizationId}/${type}-${timestamp}.png`;

  // Upload to R2
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: processedBuffer,
    ContentType: "image/png",
    CacheControl: "public, max-age=31536000", // Cache for 1 year
  });

  await client.send(command);

  // Return the public URL
  if (!R2_PUBLIC_URL) {
    throw new Error("R2_PUBLIC_URL not configured");
  }

  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Validate that an uploaded file is a valid image
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload a PNG, JPEG, GIF, WebP, or SVG image.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File too large. Maximum size is 5MB.",
    };
  }

  return { valid: true };
}
