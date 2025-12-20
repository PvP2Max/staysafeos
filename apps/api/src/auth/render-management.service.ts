import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface RenderCustomDomain {
  id: string;
  name: string;
  domainType: string;
  publicSuffix: string;
  redirectForName: string | null;
  verificationStatus: string;
  createdAt: string;
  server: {
    id: string;
    name: string;
  };
}

@Injectable()
export class RenderManagementService implements OnModuleInit {
  private apiKey: string = "";
  private appServiceId: string = "";
  private enabled: boolean = false;

  private readonly baseUrl = "https://api.render.com/v1";

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.apiKey = this.config.get<string>("RENDER_API_KEY") || "";
    this.appServiceId = this.config.get<string>("RENDER_APP_SERVICE_ID") || "";

    if (!this.apiKey || !this.appServiceId) {
      console.warn(
        "[render-management] Missing configuration - custom domain management disabled. " +
        "Set RENDER_API_KEY and RENDER_APP_SERVICE_ID to enable."
      );
      return;
    }

    this.enabled = true;
    console.log("[render-management] Render API configured for custom domain management");
  }

  /**
   * Check if the management service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Add a custom domain to the App service
   * @param domain - The domain to add (e.g., "rides.example.com")
   */
  async addCustomDomain(domain: string): Promise<boolean> {
    if (!this.enabled) {
      console.warn("[render-management] Service disabled, skipping domain addition");
      return false;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/services/${this.appServiceId}/custom-domains`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: domain }),
        }
      );

      if (!response.ok) {
        // 409 Conflict means domain already exists - that's fine
        if (response.status === 409) {
          console.log(`[render-management] Domain ${domain} already exists in Render`);
          return true;
        }
        const error = await response.text();
        console.error(`[render-management] Failed to add domain ${domain}:`, error);
        return false;
      }

      const result = (await response.json()) as RenderCustomDomain;
      console.log(`[render-management] Added domain ${domain} to Render (ID: ${result.id})`);
      return true;
    } catch (error) {
      console.error(`[render-management] Error adding domain ${domain}:`, error);
      return false;
    }
  }

  /**
   * Remove a custom domain from the App service
   * @param domain - The domain to remove (e.g., "rides.example.com")
   */
  async removeCustomDomain(domain: string): Promise<boolean> {
    if (!this.enabled) {
      console.warn("[render-management] Service disabled, skipping domain removal");
      return false;
    }

    try {
      // Use domain name directly - Render API accepts either ID or name
      const response = await fetch(
        `${this.baseUrl}/services/${this.appServiceId}/custom-domains/${encodeURIComponent(domain)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        // 404 means domain doesn't exist - that's fine for deletion
        if (response.status === 404) {
          console.log(`[render-management] Domain ${domain} not found in Render (already removed)`);
          return true;
        }
        const error = await response.text();
        console.error(`[render-management] Failed to remove domain ${domain}:`, error);
        return false;
      }

      console.log(`[render-management] Removed domain ${domain} from Render`);
      return true;
    } catch (error) {
      console.error(`[render-management] Error removing domain ${domain}:`, error);
      return false;
    }
  }
}
