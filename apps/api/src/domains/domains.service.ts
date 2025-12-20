import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";
import { DnsVerificationService } from "./dns-verification.service";
import { LogtoManagementService } from "../auth/logto-management.service";
import { RenderManagementService } from "../auth/render-management.service";
import { randomBytes } from "crypto";

export interface CreateDomainInput {
  domain: string;
  isPrimary?: boolean;
}

export interface DomainWithDnsRecords {
  id: string;
  domain: string;
  isPrimary: boolean;
  verifiedAt: Date | null;
  sslProvisioned: boolean;
  createdAt: Date;
  dnsRecords: {
    type: string;
    name: string;
    value: string;
    status: "pending" | "verified" | "error";
  }[];
}

@Injectable()
export class DomainsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
    private readonly dnsVerification: DnsVerificationService,
    private readonly logtoManagement: LogtoManagementService,
    private readonly renderManagement: RenderManagementService
  ) {}

  private getTenantId(): string {
    const tenantId = this.requestContext.organizationId;
    if (!tenantId) {
      throw new ForbiddenException("No tenant context");
    }
    return tenantId;
  }

  private generateVerificationToken(): string {
    return `staysafe-verify-${randomBytes(16).toString("hex")}`;
  }

  async findAllForCurrentTenant(): Promise<DomainWithDnsRecords[]> {
    const tenantId = this.getTenantId();
    const domains = await this.prisma.domain.findMany({
      where: { organizationId: tenantId },
      orderBy: { createdAt: "desc" },
    });

    return domains.map((domain) => this.toDomainWithDnsRecords(domain));
  }

  async findById(id: string): Promise<DomainWithDnsRecords> {
    const tenantId = this.getTenantId();
    const domain = await this.prisma.domain.findUnique({
      where: { id },
    });

    if (!domain) {
      throw new NotFoundException("Domain not found");
    }

    if (domain.organizationId !== tenantId) {
      throw new ForbiddenException("Domain does not belong to your organization");
    }

    return this.toDomainWithDnsRecords(domain);
  }

  async create(data: CreateDomainInput): Promise<DomainWithDnsRecords> {
    const tenantId = this.getTenantId();

    // Validate domain format
    if (!this.isValidDomain(data.domain)) {
      throw new BadRequestException("Invalid domain format");
    }

    // Check if domain already exists
    const existing = await this.prisma.domain.findUnique({
      where: { domain: data.domain },
    });

    if (existing) {
      throw new ConflictException("Domain is already registered");
    }

    // Check organization's subscription tier for custom domain access
    const org = await this.prisma.organization.findUnique({
      where: { id: tenantId },
      select: { subscriptionTier: true },
    });

    const allowedTiers = ["pro", "enterprise"];
    if (!org || !allowedTiers.includes(org.subscriptionTier)) {
      throw new ForbiddenException(
        "Custom domains require Pro or Enterprise subscription"
      );
    }

    // If setting as primary, unset other primary domains
    if (data.isPrimary) {
      await this.prisma.domain.updateMany({
        where: { organizationId: tenantId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const domain = await this.prisma.domain.create({
      data: {
        organizationId: tenantId,
        domain: data.domain.toLowerCase(),
        isPrimary: data.isPrimary ?? false,
        verificationToken: this.generateVerificationToken(),
      },
    });

    return this.toDomainWithDnsRecords(domain);
  }

  async verify(id: string): Promise<DomainWithDnsRecords> {
    const tenantId = this.getTenantId();
    const domain = await this.prisma.domain.findUnique({
      where: { id },
    });

    if (!domain) {
      throw new NotFoundException("Domain not found");
    }

    if (domain.organizationId !== tenantId) {
      throw new ForbiddenException("Domain does not belong to your organization");
    }

    if (domain.verifiedAt) {
      return this.toDomainWithDnsRecords(domain);
    }

    // Verify DNS records
    const isVerified = await this.dnsVerification.verifyDomain(
      domain.domain,
      domain.verificationToken
    );

    if (!isVerified) {
      throw new BadRequestException(
        "DNS verification failed. Please ensure your DNS records are correctly configured."
      );
    }

    // Update domain as verified
    const updatedDomain = await this.prisma.domain.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });

    // Register redirect URIs in Logto for the custom domain (non-blocking)
    this.logtoManagement.addCustomDomainRedirectUris(domain.domain).catch((error) => {
      console.error(`[domains] Failed to register Logto redirect URIs for ${domain.domain}:`, error);
    });

    // Add custom domain to Render App service (non-blocking)
    this.renderManagement.addCustomDomain(domain.domain).catch((error) => {
      console.error(`[domains] Failed to add domain to Render for ${domain.domain}:`, error);
    });

    return this.toDomainWithDnsRecords(updatedDomain);
  }

  async setPrimary(id: string): Promise<DomainWithDnsRecords> {
    const tenantId = this.getTenantId();
    const domain = await this.prisma.domain.findUnique({
      where: { id },
    });

    if (!domain) {
      throw new NotFoundException("Domain not found");
    }

    if (domain.organizationId !== tenantId) {
      throw new ForbiddenException("Domain does not belong to your organization");
    }

    if (!domain.verifiedAt) {
      throw new BadRequestException("Domain must be verified before setting as primary");
    }

    // Unset other primary domains
    await this.prisma.domain.updateMany({
      where: { organizationId: tenantId, isPrimary: true },
      data: { isPrimary: false },
    });

    // Set this domain as primary
    const updatedDomain = await this.prisma.domain.update({
      where: { id },
      data: { isPrimary: true },
    });

    return this.toDomainWithDnsRecords(updatedDomain);
  }

  async delete(id: string): Promise<void> {
    const tenantId = this.getTenantId();
    const domain = await this.prisma.domain.findUnique({
      where: { id },
    });

    if (!domain) {
      throw new NotFoundException("Domain not found");
    }

    if (domain.organizationId !== tenantId) {
      throw new ForbiddenException("Domain does not belong to your organization");
    }

    await this.prisma.domain.delete({ where: { id } });

    // Remove redirect URIs from Logto and domain from Render if domain was verified (non-blocking)
    if (domain.verifiedAt) {
      this.logtoManagement.removeCustomDomainRedirectUris(domain.domain).catch((error) => {
        console.error(`[domains] Failed to remove Logto redirect URIs for ${domain.domain}:`, error);
      });

      this.renderManagement.removeCustomDomain(domain.domain).catch((error) => {
        console.error(`[domains] Failed to remove domain from Render for ${domain.domain}:`, error);
      });
    }
  }

  // Public method for tenant resolution (used by App)
  async findVerifiedByDomain(domainName: string) {
    return this.prisma.domain.findFirst({
      where: {
        domain: domainName.toLowerCase(),
        verifiedAt: { not: null },
      },
      include: {
        organization: {
          select: { slug: true },
        },
      },
    });
  }

  private isValidDomain(domain: string): boolean {
    // Basic domain validation
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }

  private toDomainWithDnsRecords(domain: {
    id: string;
    domain: string;
    isPrimary: boolean;
    verificationToken: string;
    verifiedAt: Date | null;
    sslProvisioned: boolean;
    createdAt: Date;
  }): DomainWithDnsRecords {
    const isVerified = !!domain.verifiedAt;

    return {
      id: domain.id,
      domain: domain.domain,
      isPrimary: domain.isPrimary,
      verifiedAt: domain.verifiedAt,
      sslProvisioned: domain.sslProvisioned,
      createdAt: domain.createdAt,
      dnsRecords: [
        {
          type: "CNAME",
          name: domain.domain,
          value: "proxy.staysafeos.com",
          status: isVerified ? "verified" : "pending",
        },
        {
          type: "TXT",
          name: `_staysafe-verify.${domain.domain}`,
          value: domain.verificationToken,
          status: isVerified ? "verified" : "pending",
        },
      ],
    };
  }
}
