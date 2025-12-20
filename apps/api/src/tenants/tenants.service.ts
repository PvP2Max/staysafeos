import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { GlobalStatsService } from "../global-stats/global-stats.service";
import { LogtoManagementService } from "../auth/logto-management.service";
import { RenderManagementService } from "../auth/render-management.service";

// Reserved subdomains that cannot be used as tenant slugs
const RESERVED_SLUGS = [
  "www",
  "api",
  "app",
  "auth",
  "admin",
  "proxy",
  "mail",
  "email",
  "smtp",
  "ftp",
  "cdn",
  "static",
  "assets",
  "docs",
  "help",
  "support",
  "status",
  "blog",
  "dev",
  "staging",
  "test",
];

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
    private readonly globalStatsService: GlobalStatsService,
    private readonly logtoManagement: LogtoManagementService,
    private readonly renderManagement: RenderManagementService
  ) {}

  /**
   * List all tenants (partners) with optional search
   */
  async findAll(search?: string) {
    return this.prisma.organization.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: {
        id: true,
        slug: true,
        name: true,
        theme: {
          select: {
            logoUrl: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Check if a slug is already taken or reserved
   */
  async slugExists(slug: string): Promise<boolean> {
    // Check if reserved
    if (RESERVED_SLUGS.includes(slug.toLowerCase())) {
      return true;
    }

    const org = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    return !!org;
  }

  /**
   * Create a new tenant (organization) with the owner as EXECUTIVE
   */
  async create(dto: CreateTenantDto, ownerAccountId: string) {
    // Check if slug is reserved
    if (RESERVED_SLUGS.includes(dto.slug.toLowerCase())) {
      throw new BadRequestException(`Slug "${dto.slug}" is reserved and cannot be used`);
    }

    // Check if slug is already taken
    const exists = await this.slugExists(dto.slug);
    if (exists) {
      throw new BadRequestException(`Slug "${dto.slug}" is already in use`);
    }

    // Create organization with owner membership in a transaction
    const org = await this.prisma.$transaction(async (tx) => {
      // Create default theme first
      const theme = await tx.theme.create({
        data: {
          primaryColor: "220 80% 50%", // HSL format
        },
      });

      // Create the organization with the theme
      const newOrg = await tx.organization.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          logtoOrgId: `org_${dto.slug}`, // Placeholder - should sync with Logto
          ownerAccountId: ownerAccountId,
          subscriptionTier: "free",
          themeId: theme.id,
        },
      });

      // Create EXECUTIVE membership for the owner
      await tx.membership.create({
        data: {
          accountId: ownerAccountId,
          organizationId: newOrg.id,
          role: "EXECUTIVE",
          status: "ACTIVE",
        },
      });

      // Create default settings
      await tx.organizationSettings.create({
        data: {
          organizationId: newOrg.id,
        },
      });

      return newOrg;
    });

    // Register redirect URIs in Logto for the new subdomain (non-blocking)
    this.logtoManagement.addSubdomainRedirectUris(dto.slug).catch((error) => {
      console.error(`[tenants] Failed to register Logto redirect URIs for ${dto.slug}:`, error);
    });

    return org;
  }

  async findBySlug(slug: string) {
    return this.prisma.organization.findUnique({
      where: { slug },
      include: {
        theme: true,
        domains: true,
        settings: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
        theme: true,
        domains: true,
        settings: true,
      },
    });
  }

  async updateTenant(
    slug: string,
    data: { name?: string; subscriptionTier?: string }
  ) {
    return this.prisma.organization.update({
      where: { slug },
      data,
      include: {
        theme: true,
        domains: true,
      },
    });
  }

  /**
   * Get current user's tenant with branding/theme data flattened
   */
  async getCurrentTenantWithBranding(accountId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { ownerAccountId: accountId },
      include: {
        theme: true,
        settings: true,
      },
    });

    if (!org) {
      throw new NotFoundException("No organization found for this account");
    }

    // Flatten theme data into response
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      subscriptionTier: org.subscriptionTier,
      logoUrl: org.theme?.logoUrl || null,
      faviconUrl: org.theme?.faviconUrl || null,
      primaryColor: org.theme?.primaryColor || null,
      secondaryColor: org.theme?.backgroundColor || null,
      tertiaryColor: org.theme?.mutedColor || null,
      features: {
        rideRequests: org.settings?.dispatcherEnabled ?? true,
        walkOns: org.settings?.driverEnabled ?? true,
        tcTransfers: org.settings?.safetyEnabled ?? true,
        training: true,
        shifts: true,
        analytics: true,
        supportCodes: true,
      },
    };
  }

  /**
   * Update current user's tenant branding/theme
   */
  async updateCurrentTenantBranding(
    accountId: string,
    data: {
      name?: string;
      logoUrl?: string;
      faviconUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      tertiaryColor?: string;
    }
  ) {
    // Find the first organization owned by this account
    const org = await this.prisma.organization.findFirst({
      where: { ownerAccountId: accountId },
      include: { theme: true },
    });

    if (!org) {
      throw new NotFoundException("No organization found for this account");
    }

    // Update organization name if provided
    if (data.name) {
      await this.prisma.organization.update({
        where: { id: org.id },
        data: { name: data.name },
      });
    }

    // Update theme if any theme-related fields are provided
    const themeData: Record<string, string | null> = {};
    if (data.logoUrl !== undefined) themeData.logoUrl = data.logoUrl || null;
    if (data.faviconUrl !== undefined) themeData.faviconUrl = data.faviconUrl || null;
    if (data.primaryColor !== undefined) themeData.primaryColor = data.primaryColor;
    if (data.secondaryColor !== undefined) themeData.backgroundColor = data.secondaryColor;
    if (data.tertiaryColor !== undefined) themeData.mutedColor = data.tertiaryColor;

    if (Object.keys(themeData).length > 0 && org.themeId) {
      await this.prisma.theme.update({
        where: { id: org.themeId },
        data: themeData,
      });
    }

    // Return updated organization with theme
    return this.prisma.organization.findUnique({
      where: { id: org.id },
      include: { theme: true },
    });
  }

  /**
   * Update Stripe customer ID
   */
  async updateStripeCustomer(id: string, stripeCustomerId: string) {
    return this.prisma.organization.update({
      where: { id },
      data: { stripeCustomerId },
      select: {
        id: true,
        slug: true,
        name: true,
        stripeCustomerId: true,
      },
    });
  }

  /**
   * Update subscription data (for webhook)
   */
  async updateSubscription(
    id: string,
    data: {
      subscriptionTier?: string;
      subscriptionStatus?: string;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string | null;
    }
  ) {
    return this.prisma.organization.update({
      where: { id },
      data: {
        ...(data.subscriptionTier && { subscriptionTier: data.subscriptionTier }),
        ...(data.subscriptionStatus && { subscriptionStatus: data.subscriptionStatus }),
        ...(data.stripeCustomerId && { stripeCustomerId: data.stripeCustomerId }),
        ...(data.stripeSubscriptionId !== undefined && { stripeSubscriptionId: data.stripeSubscriptionId }),
      },
      select: {
        id: true,
        slug: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });
  }

  /**
   * Get organization features by ID (owner only)
   */
  async getOrganizationFeatures(orgId: string, accountId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { settings: true },
    });

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    if (org.ownerAccountId !== accountId) {
      throw new ForbiddenException("Only the organization owner can view settings");
    }

    // Map settings to feature toggles format
    const settings = org.settings;
    return {
      organizationId: org.id,
      organizationName: org.name,
      features: {
        rideRequests: settings?.dispatcherEnabled ?? true,
        walkOns: settings?.driverEnabled ?? true,
        tcTransfers: settings?.safetyEnabled ?? true,
        training: true, // Could be based on subscription tier
        shifts: true, // Could be based on subscription tier
        analytics: true, // Could be based on subscription tier
        supportCodes: true, // Could be based on subscription tier
      },
    };
  }

  /**
   * Update organization features by ID (owner only)
   */
  async updateOrganizationFeatures(
    orgId: string,
    accountId: string,
    features: Record<string, boolean>
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { ownerAccountId: true },
    });

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    if (org.ownerAccountId !== accountId) {
      throw new ForbiddenException("Only the organization owner can update settings");
    }

    // Map feature toggles to settings fields
    const settingsUpdate: Record<string, boolean> = {};
    if (features.rideRequests !== undefined) settingsUpdate.dispatcherEnabled = features.rideRequests;
    if (features.walkOns !== undefined) settingsUpdate.driverEnabled = features.walkOns;
    if (features.tcTransfers !== undefined) settingsUpdate.safetyEnabled = features.tcTransfers;

    await this.prisma.organizationSettings.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        ...settingsUpdate,
      },
      update: settingsUpdate,
    });

    return { success: true };
  }

  /**
   * Get organization settings including required fields (owner only)
   */
  async getOrganizationSettings(orgId: string, accountId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { settings: true },
    });

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    if (org.ownerAccountId !== accountId) {
      throw new ForbiddenException("Only the organization owner can view settings");
    }

    const settings = org.settings;
    return {
      organizationId: org.id,
      organizationName: org.name,
      rankRequired: settings?.rankRequired ?? false,
      orgRequired: settings?.orgRequired ?? false,
      homeRequired: settings?.homeRequired ?? false,
    };
  }

  /**
   * Update organization settings including required fields (owner only)
   */
  async updateOrganizationSettings(
    orgId: string,
    accountId: string,
    data: {
      rankRequired?: boolean;
      orgRequired?: boolean;
      homeRequired?: boolean;
    }
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { ownerAccountId: true },
    });

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    if (org.ownerAccountId !== accountId) {
      throw new ForbiddenException("Only the organization owner can update settings");
    }

    await this.prisma.organizationSettings.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        rankRequired: data.rankRequired ?? false,
        orgRequired: data.orgRequired ?? false,
        homeRequired: data.homeRequired ?? false,
      },
      update: {
        ...(data.rankRequired !== undefined && { rankRequired: data.rankRequired }),
        ...(data.orgRequired !== undefined && { orgRequired: data.orgRequired }),
        ...(data.homeRequired !== undefined && { homeRequired: data.homeRequired }),
      },
    });

    return { success: true };
  }

  /**
   * Delete an organization (owner only)
   * Archives stats to GlobalStats before hard deletion
   */
  async deleteOrganization(orgId: string, accountId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        slug: true,
        name: true,
        ownerAccountId: true,
        themeId: true,
        domains: {
          where: { verifiedAt: { not: null } },
          select: { domain: true },
        },
      },
    });

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    if (org.ownerAccountId !== accountId) {
      throw new ForbiddenException("Only the organization owner can delete the organization");
    }

    // Archive stats to GlobalStats before deletion
    const archivedStats = await this.globalStatsService.archiveOrganizationStats(orgId);

    // Delete the organization (cascades to all related data)
    await this.prisma.$transaction(async (tx) => {
      // Delete the organization (cascade handles related data)
      await tx.organization.delete({
        where: { id: orgId },
      });

      // Delete the theme if it exists (not cascaded)
      if (org.themeId) {
        await tx.theme.delete({
          where: { id: org.themeId },
        }).catch(() => {
          // Ignore if theme doesn't exist or is used elsewhere
        });
      }
    });

    // Remove redirect URIs from Logto for subdomain and custom domains (non-blocking)
    this.logtoManagement.removeSubdomainRedirectUris(org.slug).catch((error) => {
      console.error(`[tenants] Failed to remove Logto redirect URIs for ${org.slug}:`, error);
    });

    for (const domain of org.domains) {
      this.logtoManagement.removeCustomDomainRedirectUris(domain.domain).catch((error) => {
        console.error(`[tenants] Failed to remove Logto redirect URIs for ${domain.domain}:`, error);
      });

      // Also remove custom domain from Render
      this.renderManagement.removeCustomDomain(domain.domain).catch((error) => {
        console.error(`[tenants] Failed to remove Render domain for ${domain.domain}:`, error);
      });
    }

    return {
      success: true,
      organizationName: org.name,
      archivedStats,
    };
  }

  /**
   * Get members for the current organization
   */
  async getCurrentOrgMembers(params?: { search?: string; role?: string }) {
    const org = this.requestContext.requireOrganization();

    const where: any = {
      organizationId: org.id,
      status: "ACTIVE",
    };

    if (params?.role) {
      where.role = params.role;
    }

    if (params?.search) {
      where.account = {
        OR: [
          { email: { contains: params.search, mode: "insensitive" } },
          { firstName: { contains: params.search, mode: "insensitive" } },
          { lastName: { contains: params.search, mode: "insensitive" } },
        ],
      };
    }

    const [members, total] = await Promise.all([
      this.prisma.membership.findMany({
        where,
        include: {
          account: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: [
          { role: "asc" },
          { account: { lastName: "asc" } },
        ],
      }),
      this.prisma.membership.count({ where }),
    ]);

    return { data: members, total };
  }

  /**
   * Update member role (admin/exec only)
   */
  async updateMemberRole(membershipId: string, role: string) {
    const org = this.requestContext.requireOrganization();
    const currentMembership = this.requestContext.store?.membership;

    if (!currentMembership || !["EXECUTIVE", "ADMIN"].includes(currentMembership.role)) {
      throw new ForbiddenException("Only executives and admins can update roles");
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        id: membershipId,
        organizationId: org.id,
      },
    });

    if (!membership) {
      throw new NotFoundException("Member not found");
    }

    // Can't change own role (except demoting self)
    if (membership.id === currentMembership.id && role !== "RIDER") {
      throw new ForbiddenException("Cannot promote yourself");
    }

    // Only executives can create other executives
    if (role === "EXECUTIVE" && currentMembership.role !== "EXECUTIVE") {
      throw new ForbiddenException("Only executives can promote to executive");
    }

    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { role },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Remove member from organization (admin/exec only)
   */
  async removeMember(membershipId: string) {
    const org = this.requestContext.requireOrganization();
    const currentMembership = this.requestContext.store?.membership;

    if (!currentMembership || !["EXECUTIVE", "ADMIN"].includes(currentMembership.role)) {
      throw new ForbiddenException("Only executives and admins can remove members");
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        id: membershipId,
        organizationId: org.id,
      },
      include: { organization: { select: { ownerAccountId: true } } },
    });

    if (!membership) {
      throw new NotFoundException("Member not found");
    }

    // Can't remove yourself
    if (membership.id === currentMembership.id) {
      throw new ForbiddenException("Cannot remove yourself");
    }

    // Can't remove the org owner
    if (membership.accountId === membership.organization.ownerAccountId) {
      throw new ForbiddenException("Cannot remove the organization owner");
    }

    // Soft delete - set status to INACTIVE
    await this.prisma.membership.update({
      where: { id: membershipId },
      data: { status: "INACTIVE" },
    });

    return { success: true };
  }
}
