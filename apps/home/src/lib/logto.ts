import { LogtoNextConfig } from "@logto/next";

/**
 * Creates Logto config at runtime to ensure env vars are read
 * when the function is called, not when the module is bundled.
 * This is critical for Render deployments where env vars are
 * available at runtime but not during the build step.
 */
export function getLogtoConfig(): LogtoNextConfig {
  return {
    endpoint: process.env.LOGTO_ENDPOINT || "https://placeholder.logto.app",
    appId: process.env.LOGTO_APP_ID || "placeholder",
    appSecret: process.env.LOGTO_APP_SECRET || "placeholder",
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    cookieSecret: process.env.LOGTO_COOKIE_SECRET || "complex_password_at_least_32_characters_long",
    cookieSecure: process.env.NODE_ENV === "production",
    scopes: ["openid", "profile", "email", "organizations"],
    resources: process.env.LOGTO_API_RESOURCE
      ? [process.env.LOGTO_API_RESOURCE]
      : undefined,
  };
}

// Backwards compatible export - calls getLogtoConfig() each time a property is accessed
export const logtoConfig: LogtoNextConfig = new Proxy({} as LogtoNextConfig, {
  get(_, prop: keyof LogtoNextConfig) {
    return getLogtoConfig()[prop];
  },
});

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
