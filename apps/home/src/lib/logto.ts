import { LogtoNextConfig } from "@logto/next";

// Use placeholder values during build, actual values at runtime
const endpoint = process.env.LOGTO_ENDPOINT || "https://placeholder.logto.app";
const appId = process.env.LOGTO_APP_ID || "placeholder";
const appSecret = process.env.LOGTO_APP_SECRET || "placeholder";

export const logtoConfig: LogtoNextConfig = {
  endpoint,
  appId,
  appSecret,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  cookieSecret: process.env.LOGTO_COOKIE_SECRET || "complex_password_at_least_32_characters_long",
  cookieSecure: process.env.NODE_ENV === "production",
  scopes: ["openid", "profile", "email", "organizations"],
  resources: process.env.LOGTO_API_RESOURCE
    ? [process.env.LOGTO_API_RESOURCE]
    : undefined,
};

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
