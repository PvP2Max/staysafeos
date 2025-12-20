import { Injectable, Logger } from "@nestjs/common";
import { promises as dns } from "dns";

@Injectable()
export class DnsVerificationService {
  private readonly logger = new Logger(DnsVerificationService.name);

  /**
   * Verify that a domain has the correct DNS records configured
   * Checks for:
   * 1. CNAME record pointing to app.staysafeos.com
   * 2. TXT record with the verification token
   */
  async verifyDomain(domain: string, verificationToken: string): Promise<boolean> {
    try {
      // Check both records - both must be present for verification
      const [cnameVerified, txtVerified] = await Promise.all([
        this.verifyCnameRecord(domain),
        this.verifyTxtRecord(domain, verificationToken),
      ]);

      this.logger.log(
        `DNS verification for ${domain}: CNAME=${cnameVerified}, TXT=${txtVerified}`
      );

      return cnameVerified && txtVerified;
    } catch (error) {
      this.logger.error(`DNS verification error for ${domain}:`, error);
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
