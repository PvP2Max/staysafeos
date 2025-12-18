import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RequestContextService } from "../common/context/request-context.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService
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
   * Check if a slug is already taken
   */
  async slugExists(slug: string): Promise<boolean> {
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
    // Check if slug is already taken
    const exists = await this.slugExists(dto.slug);
    if (exists) {
      throw new BadRequestException(`Slug "${dto.slug}" is already in use`);
    }

    // Create organization with owner membership in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Create default theme first
      const theme = await tx.theme.create({
        data: {
          primaryColor: "220 80% 50%", // HSL format
        },
      });

      // Create the organization with the theme
      const org = await tx.organization.create({
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
          organizationId: org.id,
          role: "EXECUTIVE",
          status: "ACTIVE",
        },
      });

      // Create default settings
      await tx.organizationSettings.create({
        data: {
          organizationId: org.id,
        },
      });

      return org;
    });
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
}
