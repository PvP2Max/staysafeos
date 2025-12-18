import { LogtoNextConfig } from "@logto/next";
import { getAccessToken } from "@logto/next/server-actions";

/**
 * Creates Logto config at runtime to ensure env vars are read
 * when the function is called, not when the module is bundled.
 * This is critical for Render deployments where env vars are
 * available at runtime but not during the build step.
 */
export function getLogtoConfig(): LogtoNextConfig {
  const config: LogtoNextConfig = {
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

  return config;
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
    const config = getLogtoConfig();
    const token = await getAccessToken(config, apiResource);
    return token;
  } catch (error) {
    console.error("[logto] Failed to get API access token:", error);
    return undefined;
  }
}

// Backwards compatible export - creates fresh config on every property access
// Uses complete Proxy traps to handle spread, iteration, and all access patterns
export const logtoConfig: LogtoNextConfig = new Proxy({} as LogtoNextConfig, {
  get(_, prop) {
    return getLogtoConfig()[prop as keyof LogtoNextConfig];
  },
  has(_, prop) {
    return prop in getLogtoConfig();
  },
  ownKeys() {
    return Reflect.ownKeys(getLogtoConfig());
  },
  getOwnPropertyDescriptor(_, prop) {
    const config = getLogtoConfig();
    if (prop in config) {
      return {
        configurable: true,
        enumerable: true,
        value: config[prop as keyof LogtoNextConfig],
      };
    }
    return undefined;
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
