import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface LogtoApplication {
  id: string;
  name: string;
  oidcClientMetadata: {
    redirectUris: string[];
    postLogoutRedirectUris: string[];
  };
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

@Injectable()
export class LogtoManagementService implements OnModuleInit {
  private endpoint: string = "";
  private m2mAppId: string = "";
  private m2mAppSecret: string = "";
  private appApplicationId: string = "";
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private enabled: boolean = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.endpoint = this.config.get<string>("LOGTO_ENDPOINT") || "";
    this.m2mAppId = this.config.get<string>("LOGTO_M2M_APP_ID") || "";
    this.m2mAppSecret = this.config.get<string>("LOGTO_M2M_APP_SECRET") || "";
    this.appApplicationId = this.config.get<string>("LOGTO_APP_APPLICATION_ID") || "";

    if (!this.endpoint || !this.m2mAppId || !this.m2mAppSecret || !this.appApplicationId) {
      console.warn(
        "[logto-management] Missing configuration - redirect URI management disabled. " +
        "Set LOGTO_M2M_APP_ID, LOGTO_M2M_APP_SECRET, and LOGTO_APP_APPLICATION_ID to enable."
      );
      return;
    }

    this.enabled = true;
    console.log("[logto-management] Logto Management API configured");
  }

  /**
   * Check if the management service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get an access token for the Management API using client credentials
   */
  private async getAccessToken(): Promise<string | null> {
    if (!this.enabled) return null;

    // Return cached token if still valid (with 60s buffer)
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }

    try {
      const tokenEndpoint = `${this.endpoint}/oidc/token`;
      const credentials = Buffer.from(`${this.m2mAppId}:${this.m2mAppSecret}`).toString("base64");

      const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          resource: `${this.endpoint}/api`,
          scope: "all",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("[logto-management] Failed to get access token:", error);
        return null;
      }

      const data = (await response.json()) as TokenResponse;
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

      return this.accessToken;
    } catch (error) {
      console.error("[logto-management] Error getting access token:", error);
      return null;
    }
  }

  /**
   * Get the current application configuration
   */
  private async getApplication(): Promise<LogtoApplication | null> {
    const token = await this.getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(
        `${this.endpoint}/api/applications/${this.appApplicationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("[logto-management] Failed to get application:", error);
        return null;
      }

      return (await response.json()) as LogtoApplication;
    } catch (error) {
      console.error("[logto-management] Error getting application:", error);
      return null;
    }
  }

  /**
   * Update application redirect URIs
   */
  private async updateApplication(
    redirectUris: string[],
    postLogoutRedirectUris: string[]
  ): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(
        `${this.endpoint}/api/applications/${this.appApplicationId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            oidcClientMetadata: {
              redirectUris,
              postLogoutRedirectUris,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("[logto-management] Failed to update application:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("[logto-management] Error updating application:", error);
      return false;
    }
  }

  /**
   * Add redirect URIs for a new subdomain tenant
   * @param slug - The tenant slug (subdomain)
   */
  async addSubdomainRedirectUris(slug: string): Promise<boolean> {
    if (!this.enabled) {
      console.warn("[logto-management] Service disabled, skipping subdomain redirect URI addition");
      return false;
    }

    const callbackUri = `https://${slug}.staysafeos.com/callback`;
    const logoutUri = `https://${slug}.staysafeos.com`;

    return this.addRedirectUris(callbackUri, logoutUri);
  }

  /**
   * Add redirect URIs for a verified custom domain
   * @param domain - The custom domain (e.g., "example.com")
   */
  async addCustomDomainRedirectUris(domain: string): Promise<boolean> {
    if (!this.enabled) {
      console.warn("[logto-management] Service disabled, skipping custom domain redirect URI addition");
      return false;
    }

    const callbackUri = `https://${domain}/callback`;
    const logoutUri = `https://${domain}`;

    return this.addRedirectUris(callbackUri, logoutUri);
  }

  /**
   * Remove redirect URIs for a deleted subdomain tenant
   * @param slug - The tenant slug (subdomain)
   */
  async removeSubdomainRedirectUris(slug: string): Promise<boolean> {
    if (!this.enabled) {
      console.warn("[logto-management] Service disabled, skipping subdomain redirect URI removal");
      return false;
    }

    const callbackUri = `https://${slug}.staysafeos.com/callback`;
    const logoutUri = `https://${slug}.staysafeos.com`;

    return this.removeRedirectUris(callbackUri, logoutUri);
  }

  /**
   * Remove redirect URIs for a custom domain
   * @param domain - The custom domain to remove
   */
  async removeCustomDomainRedirectUris(domain: string): Promise<boolean> {
    if (!this.enabled) {
      console.warn("[logto-management] Service disabled, skipping redirect URI removal");
      return false;
    }

    const callbackUri = `https://${domain}/callback`;
    const logoutUri = `https://${domain}`;

    return this.removeRedirectUris(callbackUri, logoutUri);
  }

  /**
   * Add redirect URIs to the application
   */
  private async addRedirectUris(
    callbackUri: string,
    logoutUri: string
  ): Promise<boolean> {
    const app = await this.getApplication();
    if (!app) return false;

    const currentRedirectUris = app.oidcClientMetadata.redirectUris || [];
    const currentLogoutUris = app.oidcClientMetadata.postLogoutRedirectUris || [];

    // Check if URIs already exist
    if (currentRedirectUris.includes(callbackUri)) {
      console.log(`[logto-management] Redirect URI ${callbackUri} already exists`);
      return true;
    }

    // Add new URIs
    const newRedirectUris = [...currentRedirectUris, callbackUri];
    const newLogoutUris = currentLogoutUris.includes(logoutUri)
      ? currentLogoutUris
      : [...currentLogoutUris, logoutUri];

    const success = await this.updateApplication(newRedirectUris, newLogoutUris);
    if (success) {
      console.log(`[logto-management] Added redirect URIs for ${callbackUri}`);
    }

    return success;
  }

  /**
   * Remove redirect URIs from the application
   */
  private async removeRedirectUris(
    callbackUri: string,
    logoutUri: string
  ): Promise<boolean> {
    const app = await this.getApplication();
    if (!app) return false;

    const currentRedirectUris = app.oidcClientMetadata.redirectUris || [];
    const currentLogoutUris = app.oidcClientMetadata.postLogoutRedirectUris || [];

    // Remove URIs
    const newRedirectUris = currentRedirectUris.filter((uri) => uri !== callbackUri);
    const newLogoutUris = currentLogoutUris.filter((uri) => uri !== logoutUri);

    const success = await this.updateApplication(newRedirectUris, newLogoutUris);
    if (success) {
      console.log(`[logto-management] Removed redirect URIs for ${callbackUri}`);
    }

    return success;
  }
}
