import { LogtoNextConfig } from "@logto/next";
import { getAccessToken } from "@logto/next/server-actions";
import { headers } from "next/headers";

// Use placeholder values during build, actual values at runtime
const endpoint = process.env.LOGTO_ENDPOINT || "https://placeholder.logto.app";
const appId = process.env.LOGTO_APP_ID || "placeholder";
const appSecret = process.env.LOGTO_APP_SECRET || "placeholder";

// Static config for non-request contexts (build time, etc.)
export const logtoConfig: LogtoNextConfig = {
  endpoint,
  appId,
  appSecret,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001",
  cookieSecret: process.env.LOGTO_COOKIE_SECRET || "complex_password_at_least_32_characters_long",
  cookieSecure: process.env.NODE_ENV === "production",
  scopes: ["openid", "profile", "email", "organizations"],
  resources: process.env.LOGTO_API_RESOURCE
    ? [process.env.LOGTO_API_RESOURCE]
    : undefined,
};

/**
 * Get logto config with dynamic baseUrl based on current request host.
 * Use this in server actions and route handlers for multi-tenant support.
 */
export async function getLogtoConfig(): Promise<LogtoNextConfig> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3001";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

  return {
    ...logtoConfig,
    baseUrl,
  };
}

/**
 * Get an access token for the API resource.
 * Returns undefined if no API resource is configured or token fetch fails.
 */
export async function getApiAccessToken(): Promise<string | undefined> {
  const apiResource = process.env.LOGTO_API_RESOURCE;
  if (!apiResource) {
    console.warn("[logto] LOGTO_API_RESOURCE not configured");
    return undefined;
  }

  try {
    const config = await getLogtoConfig();
    const token = await getAccessToken(config, apiResource);
    return token;
  } catch (error) {
    console.error("[logto] Failed to get API access token:", error);
    return undefined;
  }
}

// Validate at runtime (not build time)
export function validateLogtoConfig() {
  if (!process.env.LOGTO_ENDPOINT) {
    throw new Error("Missing LOGTO_ENDPOINT environment variable");
  }
  if (!process.env.LOGTO_APP_ID) {
    throw new Error("Missing LOGTO_APP_ID environment variable");
  }
  if (!process.env.LOGTO_APP_SECRET) {
    throw new Error("Missing LOGTO_APP_SECRET environment variable");
  }
}
