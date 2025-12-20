import { Injectable, Logger } from "@nestjs/common";
import { promises as dns } from "dns";

@Injectable()
export class DnsVerificationService {
  private readonly logger = new Logger(DnsVerificationService.name);

  /**
   * Verify that a domain has the correct DNS records configured
   * Checks for:
   * 1. CNAME record pointing to proxy.staysafeos.com (or HTTP verification for Cloudflare proxied domains)
   * 2. TXT record with the verification token
   */
  async verifyDomain(domain: string, verificationToken: string): Promise<boolean> {
    try {
      // Check TXT record first (required for all verifications)
      const txtVerified = await this.verifyTxtRecord(domain, verificationToken);
      if (!txtVerified) {
        this.logger.log(`DNS verification for ${domain}: TXT record not verified`);
        return false;
      }

      // Try CNAME verification first
      const cnameVerified = await this.verifyCnameRecord(domain);
      if (cnameVerified) {
        this.logger.log(`DNS verification for ${domain}: CNAME=${cnameVerified}, TXT=${txtVerified}`);
        return true;
      }

      // If CNAME fails, try HTTP verification (for Cloudflare proxied domains)
      // Cloudflare flattens CNAME records when proxy is ON, so we need to verify via HTTP
      const httpVerified = await this.verifyHttpConnectivity(domain);

      this.logger.log(
        `DNS verification for ${domain}: CNAME=${cnameVerified}, HTTP=${httpVerified}, TXT=${txtVerified}`
      );

      return httpVerified && txtVerified;
    } catch (error) {
      this.logger.error(`DNS verification error for ${domain}:`, error);
      return false;
    }
  }

  /**
   * Verify domain connectivity via HTTP
   * This is used as a fallback for Cloudflare proxied domains where CNAME is flattened
   * Makes a request to the domain and checks if our server responds with the expected header
   */
  private async verifyHttpConnectivity(domain: string): Promise<boolean> {
    try {
      // Make a request to a verification endpoint on the domain
      // Our app should respond with a specific header when it receives the request
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`https://${domain}/.well-known/staysafeos-verify`, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "StaySafeOS-Domain-Verifier/1.0",
        },
        // Don't follow redirects - we want to see if our server responds directly
        redirect: "manual",
      });

      clearTimeout(timeout);

      // Check for our custom header that indicates the request reached our server
      // The App service should respond with this header on any request to the domain
      const serverHeader = response.headers.get("x-staysafeos-server");
      const isOurServer = serverHeader === "true" || response.status === 200;

      if (isOurServer) {
        this.logger.debug(`HTTP verification succeeded for ${domain} (Cloudflare proxy mode)`);
        return true;
      }

      // Also check if we got a redirect to our app (common with Cloudflare)
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (location?.includes("staysafeos.com")) {
          this.logger.debug(`HTTP verification succeeded for ${domain} via redirect`);
          return true;
        }
      }

      this.logger.debug(`HTTP verification failed for ${domain}: status=${response.status}`);
      return false;
    } catch (error) {
      // If the domain resolves to Cloudflare but our app isn't receiving requests,
      // the connection might fail. This is expected for misconfigured domains.
      this.logger.debug(`HTTP verification error for ${domain}:`, error);
      return false;
    }
  }

  /**
   * Verify CNAME record points to app.staysafeos.com
   */
  private async verifyCnameRecord(domain: string): Promise<boolean> {
    try {
      const records = await dns.resolveCname(domain);
      const expectedTarget = "proxy.staysafeos.com";

      // Check if any CNAME record points to our target
      const isValid = records.some(
        (record) =>
          record.toLowerCase() === expectedTarget ||
          record.toLowerCase() === `${expectedTarget}.`
      );

      if (!isValid) {
        this.logger.debug(
          `CNAME for ${domain} points to ${records.join(", ")}, expected ${expectedTarget}`
        );
      }

      return isValid;
    } catch (error) {
      // CNAME might not exist or DNS lookup failed
      if ((error as NodeJS.ErrnoException).code === "ENODATA") {
        this.logger.debug(`No CNAME record found for ${domain}`);
      } else if ((error as NodeJS.ErrnoException).code === "ENOTFOUND") {
        this.logger.debug(`Domain ${domain} not found`);
      } else {
        this.logger.debug(`CNAME lookup error for ${domain}:`, error);
      }
      return false;
    }
  }

  /**
   * Verify TXT record contains the verification token
   */
  private async verifyTxtRecord(
    domain: string,
    verificationToken: string
  ): Promise<boolean> {
    try {
      const txtDomain = `_staysafe-verify.${domain}`;
      const records = await dns.resolveTxt(txtDomain);

      // TXT records can be arrays of strings (for long records)
      // Flatten and check for our token
      const flatRecords = records.map((r) => r.join(""));

      const isValid = flatRecords.some((record) => record === verificationToken);

      if (!isValid) {
        this.logger.debug(
          `TXT for ${txtDomain} contains ${flatRecords.join(", ")}, expected ${verificationToken}`
        );
      }

      return isValid;
    } catch (error) {
      // TXT might not exist or DNS lookup failed
      if ((error as NodeJS.ErrnoException).code === "ENODATA") {
        this.logger.debug(`No TXT record found for _staysafe-verify.${domain}`);
      } else if ((error as NodeJS.ErrnoException).code === "ENOTFOUND") {
        this.logger.debug(`TXT domain _staysafe-verify.${domain} not found`);
      } else {
        this.logger.debug(`TXT lookup error for ${domain}:`, error);
      }
      return false;
    }
  }

  /**
   * Check the current status of DNS records for a domain
   * Returns the status of each record type
   */
  async checkDnsStatus(
    domain: string,
    verificationToken: string
  ): Promise<{
    cname: { configured: boolean; value?: string };
    txt: { configured: boolean; value?: string };
  }> {
    const result = {
      cname: { configured: false, value: undefined as string | undefined },
      txt: { configured: false, value: undefined as string | undefined },
    };

    // Check CNAME
    try {
      const cnameRecords = await dns.resolveCname(domain);
      if (cnameRecords.length > 0) {
        result.cname.configured = true;
        result.cname.value = cnameRecords[0];
      }
    } catch {
      // Record doesn't exist
    }

    // Check TXT
    try {
      const txtDomain = `_staysafe-verify.${domain}`;
      const txtRecords = await dns.resolveTxt(txtDomain);
      if (txtRecords.length > 0) {
        result.txt.configured = true;
        result.txt.value = txtRecords[0].join("");
      }
    } catch {
      // Record doesn't exist
    }

    return result;
  }
}
