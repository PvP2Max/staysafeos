import { LogtoNextConfig } from "@logto/next";

if (!process.env.LOGTO_ENDPOINT) {
  throw new Error("Missing LOGTO_ENDPOINT environment variable");
}

if (!process.env.LOGTO_APP_ID) {
  throw new Error("Missing LOGTO_APP_ID environment variable");
}

if (!process.env.LOGTO_APP_SECRET) {
  throw new Error("Missing LOGTO_APP_SECRET environment variable");
}

export const logtoConfig: LogtoNextConfig = {
  endpoint: process.env.LOGTO_ENDPOINT,
  appId: process.env.LOGTO_APP_ID,
  appSecret: process.env.LOGTO_APP_SECRET,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  cookieSecret: process.env.LOGTO_COOKIE_SECRET || "complex_password_at_least_32_characters_long",
  cookieSecure: process.env.NODE_ENV === "production",
  // Request additional scopes
  scopes: ["openid", "profile", "email", "organizations"],
  // API resource for backend access
  resources: process.env.LOGTO_API_RESOURCE
    ? [process.env.LOGTO_API_RESOURCE]
    : undefined,
};
